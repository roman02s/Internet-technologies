document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

class AppModel {
  static async getTasklists() {
    const tasklistsRes = await fetch('http://localhost:4321/tasklists');
    return await tasklistsRes.json();
  }

  static async addTasklist(tasklistName, tasklistCount) {
    console.log(JSON.stringify({ tasklistName, tasklistCount }));
    const result = await fetch(
      'http://localhost:4321/tasklists',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tasklistName, tasklistCount })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async addTask({
    tasklistId,
    taskName,
  }) {
    const result = await fetch(
      `http://localhost:4321/tasklists/${tasklistId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async editTask({
    tasklistId,
    taskId,
    newTaskName
  }) {
    const result = await fetch(
      `http://localhost:4321/tasklists/${tasklistId}/tasks/${taskId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newTaskName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async deleteTask({
    tasklistId,
    taskId
  }) {
    const result = await fetch(
      `http://localhost:4321/tasklists/${tasklistId}/tasks/${taskId}`,
      {
        method: 'DELETE'
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async moveTask({
    fromTasklistId,
    toTasklistId,
    taskId,
    tasklistCount
  }) {
    const result = await fetch(
      `http://localhost:4321/tasklists/${fromTasklistId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toTasklistId, taskId, tasklistCount })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }
}

class App {
  constructor() {
    this.tasklists = [];
    this.tasklistscount = {};
  }

  onEscapeKeydown = ({ key }) => {
    if (key === 'Escape') {
      const input = document.getElementById('add-tasklist-input');
      input.style.display = 'none';
      input.value = '';

      const input1 = document.getElementById('add-tasklist-input-count');
      input1.style.display = 'none';
      input1.value = '';

      const button1 = document.getElementById('add-tasklist-button');
      button1.style.display = 'none';
      button1.value = '';
      

      document.getElementById('tm-tasklist-add-tasklist')
        .style.display = 'inherit';
    }
  };

  moveTask = async ({ taskID, direction }) => {
    let [
      tlIndex,
      taskIndex
    ] = taskID.split('-T');
    tlIndex = Number(tlIndex.split('TL')[1]);
    taskIndex = Number(taskIndex);
    const taskName = this.tasklists[tlIndex].tasks[taskIndex];
    const taskNameCount = this.tasklistscount[tlIndex];
    const targetTlIndex = direction === 'left'
      ? tlIndex - 1
      : tlIndex + 1;

    try {
      await AppModel.moveTask({
        fromTasklistId: tlIndex,
        toTasklistId: targetTlIndex,
        taskId: taskIndex,
        tasklistCount: taskNameCount
      });

      this.tasklists[tlIndex].deleteTask(taskIndex);
      this.tasklists[targetTlIndex].addTask(taskName);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  async init() {
    const tasklists = await AppModel.getTasklists();
    tasklists.forEach(({ tasklistName, tasks }) => {
      const newTasklist = new Tasklist({
        tlName: tasklistName,
        tlID: `TL${this.tasklists.length}`,
        moveTask: this.moveTask
      });
      tasks.forEach(task => newTasklist.tasks.push(task));
      
      this.tasklists.push(newTasklist);
      newTasklist.render();
      newTasklist.rerenderTasks();
    });

    document.getElementById('tm-tasklist-add-tasklist')
      .addEventListener(
        'click',
        (event) => {
          event.target.style.display = 'none';

          const input = document.getElementById('add-tasklist-input');
          input.style.display = 'inherit';
          input.focus();

          const input1 = document.getElementById('add-tasklist-input-count');
          input1.style.display = 'inherit';

          const button1 = document.getElementById('add-tasklist-button');
          button1.style.display = 'inherit';
          
        }
      );
    
    document.getElementById('add-tasklist-button')
    .addEventListener(
      'click',
      async (event, target) => {
      console.log(event);

      const input1 = document.getElementById('add-tasklist-input');
      const input2 = document.getElementById('add-tasklist-input-count');
      console.log(input1.value, input2.value);
      await AppModel.addTasklist(input1.value, input2.value);

      this.tasklists.push(
        new Tasklist({
          tlName: input1.value,
          tlID: `TL${this.tasklists.length}`,
          moveTask: this.moveTask,
          tlMaxCount: input2.value,
        })
      );
      this.tasklistscount[input1.value] = input2.value;
        
      this.tasklists[this.tasklists.length - 1].render();
      
      // 'tm-tasklist'
      // 'add-tasklist-input'
      input1.style.display = 'none';
      input1.value = '';
      input2.style.display = 'none';
      input2.value = '';

      const button1 = document.getElementById('add-tasklist-button');
      button1.style.display = 'none';
      button1.value = '';
      

      document.getElementById('tm-tasklist-add-tasklist')
        .style.display = 'inherit';
      }
    );

    document.addEventListener('keydown', this.onEscapeKeydown);

    document.getElementById('add-tasklist-input')
      .addEventListener('keydown', this.onInputKeydown);

    document.getElementById('add-tasklist-input-count')
    .addEventListener('keydown', this.onInputKeydown);

    document.querySelector('.toggle-switch input')
      .addEventListener(
        'change',
        ({ target: { checked } }) => {
          checked
            ? document.body.classList.add('dark-theme')
            : document.body.classList.remove('dark-theme');
        }
      );
  }
}

class Tasklist {
  constructor({
    tlName,
    tlID,
    moveTask,
    tlMaxCount = 4,
  }) {
    this.tlName = tlName;
    this.tlID = tlID;
    this.tlMaxCount = tlMaxCount;
    this.tasks = [];
    this.moveTask = moveTask;
  }

  onAddTaskButtonClick = async () => {
    console.log(this.tasks.length, this.tlMaxCount);
    if (this.tasks.length < this.tlMaxCount) {
      const newTaskName = prompt('Добавить участника: ');

      if (!newTaskName) return;

      const tasklistId = Number(this.tlID.split('TL')[1]);
      try {
        await AppModel.addTask({
          tasklistId,
          taskName: newTaskName,
        });
        this.addTask(newTaskName);
      } catch (error) {
        console.error('ERROR', error);
      }
    }
  };

  addTask = (taskName, tlMaxCount) => {
    document.querySelector(`#${this.tlID} ul`)
      .appendChild(
        this.renderTask({
          taskID: `${this.tlID}-T${this.tasks.length}`,
          taskName, tlMaxCount
        })
      );

    this.tasks.push(taskName);
  };

  onEditTask = async (taskID) => {
    const taskIndex = Number(taskID.split('-T')[1]);
    const oldTaskName = this.tasks[taskIndex];

    const newTaskName = prompt('Введите новое описание задачи', oldTaskName);

    if (!newTaskName || newTaskName === oldTaskName) {
      return;
    }

    const tasklistId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.editTask({
        tasklistId,
        taskId: taskIndex,
        newTaskName
      });

      this.tasks[taskIndex] = newTaskName;
      document.querySelector(`#${taskID} span`)
        .innerHTML = newTaskName;
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  onDeleteTaskButtonClick = async (taskID) => {
    const taskIndex = Number(taskID.split('-T')[1]);
    const taskName = this.tasks[taskIndex];

    if (!confirm(`Задача '${taskName}' будет удалена. Продолжить?`)) return;

    const tasklistId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.deleteTask({
        tasklistId,
        taskId: taskIndex
      });

      this.deleteTask(taskIndex);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  deleteTask = (taskIndex) => {
    this.tasks.splice(taskIndex, 1);
    this.rerenderTasks();
  };

  rerenderTasks = () => {
    const tasklist = document.querySelector(`#${this.tlID} ul`);
    tasklist.innerHTML = '';

    this.tasks.forEach((taskName, taskIndex) => {
      tasklist.appendChild(
        this.renderTask({
          taskID: `${this.tlID}-T${taskIndex}`,
          taskName
        })
      );
    });
  };

  renderTask = ({ taskID, taskName }) => {
    const task = document.createElement('li');
    task.classList.add('tm-tasklist-task');
    task.id = taskID;

    const span = document.createElement('span');
    span.classList.add('tm-tasklist-task-text');
    span.innerHTML = taskName;
    task.appendChild(span);

    const controls = document.createElement('div');
    controls.classList.add('tm-tasklist-task-controls');

    const upperRow = document.createElement('div');
    upperRow.classList.add('tm-tasklist-task-controls-row');

    const leftArrow = document.createElement('button');
    leftArrow.type = 'button';
    leftArrow.classList.add(
      'tm-tasklist-task-controls-button',
      'left-arrow'
    );
    leftArrow.addEventListener(
      'click',
      () => this.moveTask({ taskID, direction: 'left' })
    );
    upperRow.appendChild(leftArrow);

    const rightArrow = document.createElement('button');
    rightArrow.type = 'button';
    rightArrow.classList.add(
      'tm-tasklist-task-controls-button',
      'right-arrow'
    );
    rightArrow.addEventListener(
      'click',
      () => this.moveTask({ taskID, direction: 'right' })
    );
    upperRow.appendChild(rightArrow);

    controls.appendChild(upperRow);

    const lowerRow = document.createElement('div');
    lowerRow.classList.add('tm-tasklist-task-controls-row');

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.classList.add(
      'tm-tasklist-task-controls-button',
      'edit-icon'
    );
    editButton.addEventListener('click', () => this.onEditTask(taskID));
    lowerRow.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add(
      'tm-tasklist-task-controls-button',
      'delete-icon'
    );
    deleteButton.addEventListener('click', () => this.onDeleteTaskButtonClick(taskID));
    lowerRow.appendChild(deleteButton);

    controls.appendChild(lowerRow);

    task.appendChild(controls);

    return task;
  };

  render() {
    const tasklist = document.createElement('div');
    tasklist.classList.add('tm-tasklist');
    tasklist.id = this.tlID;

    const header = document.createElement('header');
    header.classList.add('tm-tasklist-header');
    header.innerHTML = this.tlName;
    tasklist.appendChild(header);

    const list = document.createElement('ul');
    list.classList.add('tm-tasklist-tasks');
    tasklist.appendChild(list);

    const footer = document.createElement('footer');
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('tm-tasklist-add-task');
    button.innerHTML = 'Добавить члена проекта';
    button.addEventListener('click', this.onAddTaskButtonClick);
    footer.appendChild(button);
    tasklist.appendChild(footer);

    const container = document.querySelector('main');
    container.insertBefore(tasklist, container.lastElementChild);
  }
}
