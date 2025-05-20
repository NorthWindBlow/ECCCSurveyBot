export const RatingSlider = {
  name: 'RatingSlider',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'rating_slider' || trace.payload?.name === 'rating_slider',

  render: ({ trace, element }) => {
    try {
      let { options: optionsStr, submitEvent } = trace.payload;

      // 输入验证
      if (!optionsStr || !submitEvent) {
        throw new Error("Missing required parameters");
      }

      // 解析 options 字符串为对象映射
      let mapping;
      try {
        mapping = JSON.parse(optionsStr);
      } catch (err) {
        throw new Error("Options must be a valid JSON string");
      }

      const optionKeys = Object.keys(mapping);
      if (optionKeys.length === 0) {
        throw new Error("No options found in payload");
      }

      // 创建容器
      const container = document.createElement('div');
      container.className = 'rating-slider-container';

      // 样式定义（同原样式，可省略此处复写）
      const style = document.createElement('style');
      style.textContent = `
        .rating-slider-container { width: 100%; padding: 1rem; box-sizing: border-box; gap: 10px; font-family: -apple-system, sans-serif; }
        .option-row { display: flex; align-items: center; margin: 2rem 0; position: relative; width: 100%; }
        .option-label { flex: 0 0 auto; margin-right: 1rem; font-weight: 500; color: #333; width: 180px; word-break: break-word; }
        .slider-container { flex: 1; position: relative; height: 30px; }
        .scale-labels { display: flex; justify-content: space-between; position: absolute; width: 100%; top: -20px; pointer-events: none; }
        .scale-label { position: absolute; transform: translateX(-50%); font-size: 0.85em; color: #666; white-space: nowrap; top: 10px; }
        input[type="range"] { -webkit-appearance: none; width: 100%; height: 4px; background: #ddd; border-radius: 2px; margin: 15px 0; outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #007AFF; border-radius: 50%; cursor: pointer; transition: transform 0.2s; }
        .value-display { margin-left: 1rem; min-width: 60px; text-align: center; font-weight: 300; color: #007AFF; font-size: 1.1em; position: relative; top: -10px; }
        .other-input { margin-left: 1rem; padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; display: none; }
        .submit-btn { display: block; margin: 1rem auto; padding: 0.5rem 1.5rem; background: linear-gradient(135deg, #007AFF, #0063CC); color: #fff; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: all 0.2s ease; }
        .submit-btn:disabled { background: #999; cursor: not-allowed; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,122,255,0.3); }
      `;
      container.appendChild(style);

      // 工具函数
      const findNearestPosition = (value, positions) =>
        positions.reduce((prev, curr) =>
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
      const getLabelIndex = (value, positions) => positions.indexOf(value);

      // 创建每个选项的滑块行
      optionKeys.forEach(option => {
        const maxVal = parseInt(mapping[option], 10);
        const labels = Array.from({ length: maxVal + 1 }, (_, i) => i);
        const positions = labels.map((_, i) =>
          Math.round((i / (labels.length - 1)) * 100)
        );

        const row = document.createElement('div');
        row.className = 'option-row';

        const labelEl = document.createElement('div');
        labelEl.className = 'option-label';
        labelEl.textContent = option;

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.value = 0;

        const scaleLabels = document.createElement('div');
        scaleLabels.className = 'scale-labels';
        // 仅显示首尾刻度
        ['0', String(maxVal)].forEach((txt, idx) => {
          const sp = document.createElement('span');
          sp.className = 'scale-label';
          sp.textContent = txt;
          sp.style.left = idx === 0 ? '0%' : '100%';
          sp.style.transform = idx === 0 ? 'translateX(0)' : 'translateX(-100%)';
          scaleLabels.appendChild(sp);
        });

        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'value-display';

        // 仅针对 Others 选项展示输入框
        const otherInput = document.createElement('input');
        otherInput.type = 'text';
        otherInput.placeholder = '请说明';
        otherInput.className = 'other-input';

        const updateDisplay = val => {
          const nearest = findNearestPosition(parseInt(val, 10), positions);
          const idx = getLabelIndex(nearest, positions);
          valueDisplay.textContent = labels[idx];
          slider.value = nearest;

          if (/other/i.test(option) && labels[idx] > 0) {
            otherInput.style.display = 'inline-block';
          } else if (/other/i.test(option)) {
            otherInput.style.display = 'none';
          }
        };

        slider.addEventListener('input', e => updateDisplay(e.target.value));
        updateDisplay(slider.value);

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(scaleLabels);
        sliderContainer.appendChild(valueDisplay);
        sliderContainer.appendChild(otherInput);
        row.appendChild(labelEl);
        row.appendChild(sliderContainer);
        container.appendChild(row);
      });

      // 提交按钮
      const submitButton = document.createElement('button');
      submitButton.className = 'submit-btn';
      submitButton.textContent = 'Submit';

      submitButton.onclick = e => {
        e.preventDefault();
        const results = Array.from(container.querySelectorAll('.option-row')).map(row => {
          const opt = row.querySelector('.option-label').textContent;
          const score = parseInt(row.querySelector('input[type="range"]').value, 10);
          const entry = { option: opt, score, display: score };
          if (/other/i.test(opt) && score > 0) {
            entry.detail = row.querySelector('.other-input').value || '';
          }
          return entry;
        });

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: { ratings: results, confirmation: 'Options submitted successfully' }
        });

        container.querySelectorAll('input, button').forEach(el => el.disabled = true);
        submitButton.textContent = 'Submitted';
      };

      container.appendChild(submitButton);
      element.appendChild(container);

      return () => container.remove();
    } catch (error) {
      console.error("RatingSlider Error:", error.message);
      const errorDiv = document.createElement('div');
      errorDiv.style.color = 'red';
      errorDiv.textContent = `评分组件加载失败: ${error.message}`;
      element.appendChild(errorDiv);
    }
  }
};

