export const MultipleChoice = {
  name: 'MultipleChoice',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'multiple_choice' || trace.payload.name === 'multiple_choice',

  render: ({ trace, element }) => {
    try {
      let { options, selectionLimit = 999, submitEvent } = trace.payload;

      // Parse options JSON
      try {
        options = JSON.parse(options);
      } catch (err) {
        throw new Error(`Invalid JSON for options: ${err.message}`);
      }
      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input variables: options (non-empty array) or submitEvent");
      }

      // Filter out any "None"
      options = options.filter(item => item !== "None");

      // Container + styles (unchanged) …
      const container = document.createElement('div');
      container.className = 'multiple-choice-container';
      const style = document.createElement('style');
      style.textContent = `
        /* … same styles as before … */
      `;
      container.appendChild(style);
      element.appendChild(container);

      // Create form and options flow
      const form = document.createElement('form');
      form.className = 'mc-form';
      container.appendChild(form);
      const flowContainer = document.createElement('div');
      flowContainer.className = 'options-flow';
      form.appendChild(flowContainer);

      // Keep track of selection order
      const selectedOrder = [];

      // Create each option
      options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'option';
        label.innerHTML = `
          <input type="checkbox" name="option" value="${option}">
          <span class="option-text">${option}</span>
        `;
        const input = label.querySelector('input');

        input.addEventListener('change', () => {
          if (input.checked) {
            // New selection: push into order
            selectedOrder.push(option);

            // If over limit, uncheck the oldest
            if (selectedOrder.length > selectionLimit) {
              const oldest = selectedOrder.shift();
              const oldestInput = form.querySelector(`input[value="${oldest}"]`);
              if (oldestInput) {
                oldestInput.checked = false;
                oldestInput.parentElement.classList.remove('selected');
              }
            }
            label.classList.add('selected');
          } else {
            // Deselection: remove from order list
            const idx = selectedOrder.indexOf(option);
            if (idx > -1) selectedOrder.splice(idx, 1);
            label.classList.remove('selected');
          }
        });

        flowContainer.appendChild(label);
      });

      // “Other” input logic (unchanged) …
      const hasOtherOption = options.includes("Other");
      let otherInputContainer = null;
      if (hasOtherOption) {
        otherInputContainer = document.createElement('div');
        otherInputContainer.className = 'other-input';
        otherInputContainer.innerHTML = `<input type="text" id="other-option" placeholder="Please type your answer">`;
        form.appendChild(otherInputContainer);

        const otherCheckbox = form.querySelector('input[value="Other"]');
        if (otherCheckbox) {
          otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
          otherCheckbox.addEventListener('change', () => {
            otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
          });
        }
      }

      // Submit button (unchanged) …
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = 'Submit';
      form.appendChild(submitButton);

      // Submit handler (unchanged) …
      const submitHandler = (event) => {
        event.preventDefault();
        let selectedOptions = Array.from(form.querySelectorAll('input[name="option"]:checked'))
          .map(cb => cb.value);

        if (hasOtherOption && selectedOptions.includes("Other")) {
          const otherValue = form.querySelector('#other-option').value.trim();
          selectedOptions = selectedOptions.filter(v => v !== "Other");
          if (otherValue) selectedOptions.push(`Other: ${otherValue}`);
        }

        if (selectedOptions.length === 0) {
          alert('Please select at least one option.');
          return;
        }

        // Disable all controls after submit
        form.querySelectorAll('input, button').forEach(el => el.disabled = true);
        submitButton.textContent = 'Submitted';
        container.classList.add("submitted");

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            selectedOptions,
            confirmation: 'Options submitted successfully'
          }
        });
      };
      form.addEventListener('submit', submitHandler);

      // Cleanup
      return () => {
        form.removeEventListener('submit', submitHandler);
        container.remove();
      };
    } catch (error) {
      console.error("MultipleChoice Component Error:", error.message);
    }
  }
};
