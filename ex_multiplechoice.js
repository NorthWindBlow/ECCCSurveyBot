export const MultipleChoice = {
  name: 'MultipleChoice',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'multiple_choice' || trace.payload?.name === 'multiple_choice',

  render: ({ trace, element }) => {
    try {
      let { options: rawOptions, selectionLimit = 999, submitEvent } = trace.payload;

      function parseOptions(rawOptions) {
        if (Array.isArray(rawOptions)) {
          return rawOptions;
        }
        if (typeof rawOptions !== 'string') {
          throw new Error(`options must be an Array or string, but got ${typeof rawOptions}`);
        }
      
        let s = rawOptions.trim();
        if (/^['"`‘’“”`].*['"`‘’“”`]$/.test(s)) {
          s = s.slice(1, -1).trim();
        }
      
        s = s
          .replace(/[\u201C\u201D\u201F\uFF02]/g, '"')
          .replace(/[\u2018\u2019\u201A\u201B\uFF07]/g, "'");
      
        s = s.replace(/'([^']*)'/g, '"$1"');
      
        let parsed;
        try {
          parsed = JSON.parse(s);
        } catch (err1) {
          throw new Error(`Invalid JSON for options after normalization: ${err1.message}`);
        }
      
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch (err2) {
            throw new Error(`Invalid JSON for options on second pass: ${err2.message}`);
          }
        }
      
        if (!Array.isArray(parsed)) {
          throw new Error(`Parsed options is not an array: ${typeof parsed}`);
        }
      
        return parsed;
      }

      let options = parseOptions(rawOptions);

      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input variables: options (non-empty array) or submitEvent");
      }

      options = options.filter(item => item !== "None");

      const container = document.createElement('div');
      container.className = 'multiple-choice-container';

      const style = document.createElement('style');
      style.textContent = `
        .multiple-choice-container {
          width: auto;
          max-width: 100%;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-family: sans-serif;
          font-size: inherit; /* 使用默认字体大小 */
        }
        .options-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-items: center;
          align-items: center;
          min-height: 100px;
          padding: 10px;
        }
        .option {
          position: relative;
          padding: 0.25rem 0.75rem; /* 更贴合文字的内边距 */
          margin: 0;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          max-width: 100%;
          min-width: 0; /* 允许文本换行 */
        }
        .option:hover {
          background: #f0f0f0;
        }
        .option.selected {
          background: #007AFF;
          border-color: #007AFF;
          color: #fff;
        }
        .option input {
          opacity: 0;
          position: absolute;
        }
        .option-text {
          display: block;
          line-height: 1;
          white-space: normal; /* 自动换行 */
          word-wrap: break-word;
        }
        .mc-form button[type="submit"] {
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: #fff;
          border: none;
          padding: 0.25rem 0.75rem; /* 更贴合文字 */
          border-radius: 8px;
          font-family: inherit;
          font-size: inherit; /* 使用默认字体大小 */
          cursor: pointer;
          transition: all 0.2s ease;
          display: block;
          margin: 0 auto;
          white-space: normal; /* 长文字自动换行 */
          max-width: 100%;
          word-wrap: break-word;
        }
        .mc-form button[type="submit"]:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .mc-form button[type="submit"]:disabled {
          background: #999;
          cursor: not-allowed;
        }
        .submitted {
          pointer-events: none;
          opacity: 0.8;
        }
      `;
      container.appendChild(style);
      element.appendChild(container);

      const form = document.createElement('form');
      form.className = 'mc-form';
      container.appendChild(form);

      const flowContainer = document.createElement('div');
      flowContainer.className = 'options-flow';
      form.appendChild(flowContainer);

      const updateCheckboxState = () => {
        const checkboxes = Array.from(form.querySelectorAll('input[name="option"]'));
        const checkedCount = checkboxes.filter(cb => cb.checked).length;
        checkboxes.forEach(cb => {
          cb.disabled = !cb.checked && checkedCount >= selectionLimit;
        });
      };

      options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'option';
        label.innerHTML = `
          <input type="checkbox" name="option" value="${option}">
          <span class="option-text">${option}</span>
        `;
        const input = label.querySelector('input');
        input.addEventListener('change', () => {
          label.classList.toggle('selected', input.checked);
          updateCheckboxState();
        });
        flowContainer.appendChild(label);
      });

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
        otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
        otherCheckbox.addEventListener('change', () => {
          otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
          updateCheckboxState();
        });
      }

      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = 'Submit';
      form.appendChild(submitButton);

      const submitHandler = event => {
        event.preventDefault();

        let selectedOptions = Array.from(form.querySelectorAll('input[name="option"]:checked'))
          .map(cb => cb.value);

        if (hasOtherOption && selectedOptions.includes("Other")) {
          const otherValue = form.querySelector('#other-option').value.trim();
          selectedOptions = selectedOptions.filter(v => v !== "Other");
          if (otherValue) selectedOptions.push(`Other: ${otherValue}`);
        }

        if (!selectedOptions.length) {
          alert('Please select at least one option.');
          return;
        }

        form.querySelectorAll('input, button').forEach(el => el.disabled = true);
        submitButton.textContent = 'Submitted';
        container.classList.add('submitted');

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: { result: selectedOptions, confirmation: 'Options submitted successfully' }
        });
      };

      form.addEventListener('submit', submitHandler);

      return () => {
        form.removeEventListener('submit', submitHandler);
        container.remove();
      };

    } catch (error) {
      console.error('MultipleChoice Component Error:', error.message);
    }
  }
};
