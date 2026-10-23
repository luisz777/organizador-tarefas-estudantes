(function () {
  var KEY = "tarefas-estudante-v1";
  var tasks = [];
  var status = "todas";

  var $ = function (id) {
    return document.getElementById(id);
  };

  function load() {
    try {
      var data = localStorage.getItem(KEY);
      tasks = data ? JSON.parse(data) : [];
    } catch (e) {
      tasks = [];
    }

    if (!Array.isArray(tasks)) {
      tasks = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error("Não foi possível salvar as tarefas.", e);
    }
  }

  function today() {
    var date = new Date();

    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");
  }

  function formatDate(date) {
    var parts = date.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function isLate(task) {
    return !task.done && task.due && task.due < today();
  }

  var order = {
    alta: 0,
    media: 1,
    baixa: 2
  };

  function render() {
    var filter = $("fd");
    var currentSubject = filter.value;

    var subjects = [];

    tasks.forEach(function (task) {
      if (task.disc && subjects.indexOf(task.disc) === -1) {
        subjects.push(task.disc);
      }
    });

    subjects.sort();

    filter.innerHTML = "";

    var option = document.createElement("option");
    option.value = "";
    option.textContent = "Todas as disciplinas";
    filter.appendChild(option);

    subjects.forEach(function (subject) {
      var item = document.createElement("option");
      item.value = subject;
      item.textContent = subject;
      filter.appendChild(item);
    });

    filter.value = subjects.indexOf(currentSubject) >= 0
      ? currentSubject
      : "";

    var selectedSubject = filter.value;

    $("sTotal").textContent = tasks.length;

    $("sPend").textContent = tasks.filter(function (task) {
      return !task.done;
    }).length;

    $("sLate").textContent = tasks.filter(isLate).length;

    var shown = tasks.filter(function (task) {
      if (status === "pendentes" && task.done) {
        return false;
      }

      if (status === "concluidas" && !task.done) {
        return false;
      }

      if (selectedSubject && task.disc !== selectedSubject) {
        return false;
      }

      return true;
    });

    shown.sort(function (a, b) {
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }

      var dateA = a.due || "9999-99-99";
      var dateB = b.due || "9999-99-99";

      if (dateA !== dateB) {
        return dateA < dateB ? -1 : 1;
      }

      return (order[a.prio] ?? 1) - (order[b.prio] ?? 1);
    });

    var list = $("list");
    list.innerHTML = "";

    if (shown.length === 0) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Nenhuma tarefa por aqui.";
      list.appendChild(empty);
      return;
    }

    shown.forEach(function (task) {
      var item = document.createElement("li");
      item.className = "task" + (task.done ? " done" : "");

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", "Concluir tarefa");

      checkbox.onchange = function () {
        task.done = checkbox.checked;
        save();
        render();
      };

      var content = document.createElement("div");
      content.className = "body";

      var title = document.createElement("div");
      title.className = "title";
      title.textContent = task.title;

      var meta = document.createElement("div");
      meta.className = "meta";

      function addTag(text, className) {
        var tag = document.createElement("span");
        tag.className = "tag " + (className || "");
        tag.textContent = text;
        meta.appendChild(tag);
      }

      var priorities = {
        alta: "Alta",
        media: "Média",
        baixa: "Baixa"
      };

      addTag(priorities[task.prio] || "Média", task.prio);

      if (task.disc) {
        addTag(task.disc);
      }

      if (task.due) {
        var late = isLate(task);

        addTag(
          (late ? "Atrasada · " : "Prazo ") + formatDate(task.due),
          late ? "late" : ""
        );
      }

      content.appendChild(title);
      content.appendChild(meta);

      var removeButton = document.createElement("button");
      removeButton.className = "del";
      removeButton.type = "button";
      removeButton.textContent = "✕";
      removeButton.setAttribute("aria-label", "Excluir tarefa");

      removeButton.onclick = function () {
        tasks = tasks.filter(function (itemTask) {
          return itemTask !== task;
        });

        save();
        render();
      };

      item.appendChild(checkbox);
      item.appendChild(content);
      item.appendChild(removeButton);

      list.appendChild(item);
    });
  }

  $("f").onsubmit = function (event) {
    event.preventDefault();

    var title = $("t").value.trim();

    if (!title) {
      return;
    }

    tasks.push({
      id: Date.now(),
      title: title,
      disc: $("d").value.trim(),
      due: $("due").value,
      prio: $("p").value,
      done: false
    });

    save();

    $("f").reset();
    $("p").value = "media";

    render();
    $("t").focus();
  };

  document.querySelectorAll(".filters button").forEach(function (button) {
    button.onclick = function () {
      status = button.dataset.s;

      document.querySelectorAll(".filters button").forEach(function (item) {
        item.classList.toggle("on", item === button);
      });

      render();
    };
  });

  $("fd").onchange = render;

  $("theme").onclick = function () {
    var root = document.documentElement;

    var isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    root.dataset.theme = isDark ? "light" : "dark";
  };

  load();
  render();
})();
