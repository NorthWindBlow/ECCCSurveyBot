export const RatingSlider = {
  name: 'RatingSlider',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'rating_slider' || trace.payload.name === 'rating_slider',

  render: ({ trace, element }) => {
    try {
      let { options, labels = [1, 100], submitEvent } = trace.payload;

      // 输入验证
      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required parameters");
      }
      if (!Array.isArray(labels) || labels.length < 2) {
        throw new Error("Labels must be an array with at least 2 elements");
      }

      // 如果 options 是数组，则过滤掉其中的 "None" 元素
      options = Array.isArray(options)
        ? options.filter(item => item !== "None")
        : options;

      // 生成刻度位置
      const labelPositions = labels.map((_, i) =>
        Math.round((i / (labels.length - 1)) * 100)
      );

      const container = document.createElement('div');
      container.className = 'rating-slider-container';

      // 样式定义：容器宽度设为 100%，并使用 box-sizing 保证充分利用父容器空间
      const style = document.createElement('style');
      style.textContent = `
        .rating-slider-container {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 1rem;
          box-sizing: border-box;
          gap: 10px;
          font-family: -apple-system, sans-serif;
        }

        .option-row {
          display: flex;
          align-items: center;
          margin: 2rem 0rem;
          position: relative;
          width: 100%;
          max-width: 100%;
        }

        .option-label {
          flex: 0 0 auto;
          margin-right: 1rem;
          font-weight: 500;
          color: #333;
          width: 120px; /* 固定宽度，确保每一行相同 */
          // max-width: 40%;
          white-space: normal;
          word-break: break-word;
        }

        .slider-container {
          flex: 1;
          width: auto;
          // min-width: 60%;
          // max-width: 100%;
          position: relative;
          height: 30px;
        }

        .scale-labels {
          display: flex;
          justify-content: space-between;
          position: absolute;
          width: 100%;
          top: -20px;
          pointer-events: none;
        }

        .scale-label {
          position: absolute;
          transform: translateX(-50%);
          font-size: 0.85em;
          color: #666;
          white-space: nowrap;
          top: 10px;
        }

        .scale-label:first-child {
          left: 0;
          transform: translateX(0);
        }

        .scale-label:last-child {
          left: 100%;
          transform: translateX(-100%);
        }

        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          background: #ddd;
          border-radius: 2px;
          margin: 15px 0;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #007AFF;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .value-display {
          margin-left: 1rem;
          min-width: 60px;
          text-align: center;
          font-weight: 300;
          color: #007AFF;
          font-size: 1.1em;
          position: relative;
          top: -10px;
        }

        .submit-btn {
          display: block;
          width: fit-content;
          margin: 0 auto;
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,122,255,0.3);
        }
      `;
      container.appendChild(style);

      // 工具函数：找到最近的刻度
      const findNearestPosition = (value) => {
        return labelPositions.reduce((prev, curr) =>
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
      };

      // 工具函数：获取对应的标签索引
      const getLabelIndex = (value) => {
        return labelPositions.findIndex(pos => pos === value);
      };

      // 创建每个选项的滑块行
      options.forEach(option => {
        const row = document.createElement('div');
        row.className = 'option-row';

        const label = document.createElement('div');
        label.className = 'option-label';
        label.textContent = option;

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        // 主滑块
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.value = 50;

        // 刻度标签（只显示首尾）
        const scaleLabels = document.createElement('div');
        scaleLabels.className = 'scale-labels';
        const firstLabel = document.createElement('span');
        firstLabel.className = 'scale-label';
        firstLabel.textContent = labels[0];
        const lastLabel = document.createElement('span');
        lastLabel.className = 'scale-label';
        lastLabel.textContent = labels[labels.length - 1];
        scaleLabels.appendChild(firstLabel);
        scaleLabels.appendChild(lastLabel);

        // 数值显示
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'value-display';

        // 更新显示及对滑块值进行“吸附”
        const updateDisplay = (value) => {
          const snapValue = findNearestPosition(value);
          const labelIndex = getLabelIndex(snapValue);
          valueDisplay.textContent = labels[labelIndex] || snapValue;
          slider.value = snapValue;
        };

        // 事件监听
        slider.addEventListener('input', (e) => updateDisplay(e.target.value));

        // 初始化显示
        updateDisplay(slider.value);

        // 组装组件
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(scaleLabels);
        sliderContainer.appendChild(valueDisplay);
        row.appendChild(label);
        row.appendChild(sliderContainer);
        container.appendChild(row);
      });

      // 提交按钮
      const submitButton = document.createElement('button');
      submitButton.className = 'submit-btn';
      submitButton.textContent = 'Submit';

      submitButton.onclick = (e) => {
        e.preventDefault();

        const results = Array.from(container.querySelectorAll('.option-row')).map(row => {
          const value = parseInt(row.querySelector('input').value);
          return {
            option: row.querySelector('.option-label').textContent,
            score: value,
            display: labels[getLabelIndex(value)] || value
          };
        });

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            ratings: results,
            confirmation: 'Options submitted successfully'
          }
        });

        // 提交后禁用所有滑块和提交按钮
        container.querySelectorAll('input[type="range"]').forEach(input => input.disabled = true);
        submitButton.disabled = true;
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
