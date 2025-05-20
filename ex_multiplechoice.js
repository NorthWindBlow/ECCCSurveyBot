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

      // Remove any "None" entries
      options = options.filter(item => item !== "None");

      // Create container
      const container = document.createElement('div');
      container.className = 'multiple-choice-container';

      // Inject styles
      const style = document.createElement('style');
      style.textContent = `
        .multiple-choice-container {
          width: auto;
          max-width: 100%;
          margin: 0rem 0rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-family: sans-serif;
        }
        .options-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          width: auto;
          max-width: 100%;
          justify-items: center;
          align-items: center;
          min-height: 100px;
          border: none;
          padding: 10px;
        }
        .option {
          width: fit-content;
          position: relative;
          padding: 0.5rem 1.5rem;
          font-size: 1rem;
          margin: 0 auto;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          white-space: nowrap;
          max-width: 100%;
          min-width: min-content;
          min-height: min-content;
          display: block;
          align-items: center;
          justify-content: center;
        }
        .option:hover {
          background: #f0f0f0 !important;
        }
        .option.selected {
          background: #007AFF !important;
          border-color: #007AFF;
          color: white;
        }
        .option input {
          opacity: 0;
          position: absolute;
        }
        .option-text {
          display: block;
          line-height: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          white-space: nowrap;
        }
        .mc-form button[type="submit"] {
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: block;
          margin: 0 auto;
          width: fit-content;
        }
        .mc-form button[type="submit"]:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .mc-form button[type="submit"]:disabled {
          background: #999;
          cursor: not-allowed;
        }
        .mc-form button[type="submit"]:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,122,255,0.3);
        }
        .other-input {
          margin-top: 0.5rem;
          margin-bottom: 1rem;
        }
        .other-input input {
          width: 95%;
          padding: 0.5rem;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          margin-top: 0.2rem;
        }
        /* After submission, disable all controls */
        .submitted {
          pointer-events: none;
          opacity: 0.8;
        }
      `;
      container.appendChild(style);
      element.appendChild(container);

      // Create form
      const form = document.createElement('form');
      form.className = 'mc-form';
      container.appendChild(form);

      // Create options flow container
      const flowContainer = document.createElement('div');
      flowContainer.className = 'options-flow';
      form.appendChild(flowContainer);

      // Track the order of selections
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
            // Add to selection order
            selectedOrder.push(option);
            // If over limit, remove oldest selection
            if (selectedOrder.length > selectionLimit) {
              const oldest = selectedOrder.shift();
              const oldestInput = form.querySelector(\`input[value="\${oldest}"]\`);
              if (oldestInput) {
                oldestInput.checked = false;
                oldestInput.parentElement.classList.remove('selected');
              }
            }
            label.classList.add('selected');
          } else {
            // Remove from selection order
            const idx = selectedOrder.indexOf(option);
            if (idx > -1) selectedOrder.splice(idx, 1);
            label.classList.remove('selected');
          }
        });

        flowContainer.appendChild(label);
      });

      // Handle "Other" option
      const hasOtherOption = options.includes("Other");
      let otherInputContainer = null;
      if (hasOtherOption) {
        otherInputContainer = document.createElement('div');
        otherInputContainer.className = 'other-input';
        otherInputContainer.innerHTML = `
          <input type="text" id="other-option" placeholder="Please type your answer">
        `;
        form.appendChild(otherInputContainer);

        const otherCheckbox = form.querySelector('input[value="Other"]');
        if (otherCheckbox) {
          otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
          otherCheckbox.addEventListener('change', () => {
            otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
          });
        }
      }

      // Add submit button
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = 'Submit';
      form.appendChild(submitButton);

      // Submission handler
      const submitHandler = (event) => {
        event.preventDefault();

        let selectedOptions = Array.from(
          form.querySelectorAll('input[name="option"]:checked')
        ).map(cb => cb.value);

        if (hasOtherOption && selectedOptions.includes("Other")) {
          const otherValue = form.querySelector('#other-option').value.trim();
          selectedOptions = selectedOptions.filter(v => v !== "Other");
          if (otherValue) {
            selectedOptions.push(`Other: ${otherValue}`);
          }
        }

        if (selectedOptions.length === 0) {
          alert('Please select at least one option.');
          return;
        }

        // Disable all controls
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

      // Cleanup on unmount
      return () => {
        form.removeEventListener('submit', submitHandler);
        container.remove();
      };

    } catch (error) {
      console.error("MultipleChoice Component Error:", error.message);
    }
  }
};
