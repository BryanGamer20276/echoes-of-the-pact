// public/story/js/storyEditorQuestions.js
(function () {
  const shared = window.EOTPStoryShared || {};
  const createId =
    shared.createId ||
    function (prefix) {
      return (
        (prefix || "ans") +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(16).slice(2)
      );
    };

  function setupQuestionEditor(options) {
    const opts = options || {};
    const inspectorEl = opts.inspectorEl;
    const rewardInputEl = opts.rewardInputEl;
    const answersContainerEl = opts.answersContainerEl;
    const addAnswerBtnEl = opts.addAnswerBtnEl;

    let answers = [];

    function renderAnswers() {
      if (!answersContainerEl) return;
      answersContainerEl.innerHTML = "";

      if (!answers.length) {
        const p = document.createElement("p");
        p.textContent =
          "Aún no hay respuestas. Añade al menos una y marca la correcta.";
        p.style.fontSize = "0.8rem";
        p.style.color = "#a5b4fc";
        answersContainerEl.appendChild(p);
        return;
      }

      answers.forEach((ans, index) => {
        const row = document.createElement("div");
        row.className = "answer-row";

        const input = document.createElement("input");
        input.type = "text";
        input.value = ans.text || "";
        input.className = "editor-input answer-input";
        input.placeholder = "Texto de la respuesta";

        input.addEventListener("input", () => {
          answers[index].text = input.value;
        });

        const correctLabel = document.createElement("label");
        correctLabel.className = "answer-correct";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "correctAnswer";
        radio.checked = !!ans.isCorrect;

        radio.addEventListener("change", () => {
          answers = answers.map((a, i) => ({
            ...a,
            isCorrect: i === index,
          }));
          renderAnswers();
        });

        correctLabel.appendChild(radio);
        correctLabel.appendChild(document.createTextNode("Correcta"));

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "answer-delete";
        delBtn.textContent = "×";
        delBtn.addEventListener("click", () => {
          answers.splice(index, 1);
          if (
            answers.length &&
            !answers.some((a) => a.isCorrect)
          ) {
            answers[0].isCorrect = true;
          }
          renderAnswers();
        });

        row.appendChild(input);
        row.appendChild(correctLabel);
        row.appendChild(delBtn);

        answersContainerEl.appendChild(row);
      });
    }

    function setAnswers(list) {
      answers = (list || []).map((a) => ({
        id: a.id || createId("ans"),
        text: a.text || "",
        isCorrect: !!a.isCorrect,
      }));
      if (answers.length && !answers.some((a) => a.isCorrect)) {
        answers[0].isCorrect = true;
      }
      renderAnswers();
    }

    function getAnswers() {
      return answers.slice();
    }

    function setReward(value) {
      if (!rewardInputEl) return;
      const val = Number.isFinite(value) ? value : 0;
      rewardInputEl.value = String(val);
    }

    function getReward() {
      if (!rewardInputEl) return 0;
      const val = Number(rewardInputEl.value);
      if (!Number.isFinite(val) || val < 0) return 0;
      return Math.floor(val);
    }

    function clear() {
      answers = [];
      setReward(0);
      renderAnswers();
    }

    function showInspector(visible) {
      if (!inspectorEl) return;
      if (visible) {
        inspectorEl.classList.remove("hidden");
      } else {
        inspectorEl.classList.add("hidden");
      }
    }

    if (addAnswerBtnEl) {
      addAnswerBtnEl.addEventListener("click", () => {
        answers.push({
          id: createId("ans"),
          text: "",
          isCorrect: answers.length === 0,
        });
        renderAnswers();
      });
    }

    if (rewardInputEl) {
      rewardInputEl.addEventListener("input", () => {
        const val = Number(rewardInputEl.value);
        if (!Number.isFinite(val) || val < 0) {
          rewardInputEl.value = "0";
        }
      });
    }

    return {
      showInspector,
      setReward,
      getReward,
      setAnswers,
      getAnswers,
      clear,
    };
  }

  window.EOTPStoryEditorQuestions = {
    setupQuestionEditor,
  };
})();
