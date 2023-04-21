import {zlFetch} from 'zl-fetch'
// Start writing JavaScript here!
const todolist = document.querySelector('.todolist');
const taskList = todolist.querySelector('.todolist__tasks');
const rootendpoint = 'https://api.learnjavascript.today';

const generateUniqueString = length => Math.random().toString(36).substring(2, 2 + length);

// create new task to add it into the taskList
const makeTaskElement = ({id, name, done}) => {
  // make the task <li> element
  const newTask = document.createElement('li');
  // Add 'task' class to li element
  newTask.classList.add('task');
  // Add important innerHTML to li element to style the item, also sanitize it
  newTask.innerHTML = DOMPurify.sanitize(`
  <input type="checkbox" id="${id}" ${done ? 'checked' : ''}>
          <label for="${id}">
            <svg viewBox="0 0 20 15">
              <path d="M0 8l2-2 5 5L18 0l2 2L7 15z" fill-rule="nonzero" />
            </svg>
          </label>
          <input class="task__name" value="${name}">
          <button type="button" class="task__delete-button">
            <svg viewBox="0 0 20 20">
              <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"/>
            </svg>
          </button>`);
          // return li element
          return newTask;
        }
        
    // Add task event listener
    todolist.addEventListener('submit', (e) => {
      // Preventing deafult behaviour of form
    e.preventDefault();
    // get input to get its valaue
    const newTaskField = todolist.querySelector('input');
    // get input value entered by user after that trim & sanitize it
    const inputValue = DOMPurify.sanitize(newTaskField.value.trim());
    
    // if no value entered, return nothing and dont proceed further
    if (!inputValue) return;
    // get newTask button to get its span
    const newTaskButton = todolist.querySelector('.submit');
      // get span from newTask button to get and change its textContent
    const newTaskButtonText = newTaskButton.querySelector('span');
      // change textContent of newTask button after user pressed it, until task is added to database and DOM
    newTaskButtonText.textContent = 'Adding task...';
    // disable newTask button after user pressed it, until task is added to database and DOM
    newTaskButton.setAttribute('disabled', true);

  // Adding tasks to databse
  zlFetch.post(`${rootendpoint}/tasks`, {
    auth,
    body: {
      name: inputValue
    }
  })  
  .then((response) => {
  // Adding tasks to DOM
    const task = response.body;
    const newTaskElement = makeTaskElement(task);
    taskList.appendChild(newTaskElement);

    // Making task input field empty after adding one task
    newTaskField.value = '';
    // Make task input field focused after adding one task (UI improvement)
    newTaskField.focus();

    })
  .catch((error) => {console.log(error)})
  .finally(() => {
    // after task is added to database and DOM, revert the changed text of button
    newTaskButtonText.textContent = 'Add task';
    // after task is added to database and DOM, enable newTask button
    newTaskButton.removeAttribute('disabled');
  });
})

todolist.addEventListener('click', (e) => {
  if(!e.target.matches('.task__delete-button')) return;
  // get <li> element which is being deleted
  const taskElement = e.target.parentElement;
  // get checkbox to get its id
  const checkbox = taskElement.querySelector('input[type="checkbox"]');
  // get id of checkbox to put it in api endpoint
  const id = checkbox.id;

  // Delete tasks from database
  zlFetch.delete(`${rootendpoint}/tasks/${id}`, {auth})
  .then( _ => {
  // Delete tasks from DOM
    taskList.removeChild(taskElement);
    // innerHTML of Empty taskList is set to empty
    if (taskList.children.length === 0) {
      taskList.innerHTML = ''
    }
  })
  .catch(err => console.log(err))
})

// Debounce function that reduces no. of requests sent to the database using timer
function debounce(callback, wait, immediate) {
  let timeout
  return function () {
    const context = this
    const args = arguments
    const later = function () {
      timeout = null
      if (!immediate) callback.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) callback.apply(context, args)
  }
}

// Debounce function is like 'const debouncedFunction = debounce(callback, wait)'
const debouncedFunction = debounce(e => {
  // get <li> element which is being updated
  const taskElement = e.target.parentElement;
  // get checkbox to get its id and state of check
  const checkbox = taskElement.querySelector('input[type="checkbox"]');
  // get <input> element to get its updated value
  const taskInput = taskElement.querySelector('.task__name');

  // get id of checkbox to put it in api endpoint
  const id = checkbox.id;
  const done = checkbox.checked;
  // Sanitizing the input value entered by user
  const name = DOMPurify.sanitize(taskInput.value);

  // Updating tasks names and state in databse
  zlFetch.put(`${rootendpoint}/tasks/${id}`, {
    auth,
    body: {
      name,
      done
    }
  })
  .then(res => console.log(res.body))
  .catch(err => console.log(err))
}, 250)

// This event listener Updates task name and state on database
taskList.addEventListener('input', debouncedFunction);


// ***Creating new user

// zlFetch.post(`${rootendpoint}/users`, {
//   body: {
//     username: 'newUser',
//     password: 'testPassword'
//   }
// })
// .then(response => {console.log(response.body)})
// .catch(error => {console.log(error)});


// Creating auth object which is needed for every server request
const auth = {
  username: 'newUser',
  password: 'testPassword'
};

// Use this variable to change empty div's content when needed
const emptyStateDiv = todolist.querySelector('.todolist__empty-state')

// ***Getting tasks from database
zlFetch(`${rootendpoint}/tasks`,{auth})
.then(response => {
// Change empty state text
  const tasks = response.body;
  tasks.forEach(task => {
    const newTask = makeTaskElement(task);
    taskList.appendChild(newTask);
  })
// Change empty state text after getting results (bcz now it is not fetching tasks)
  emptyStateDiv.textContent = 'Your todo list is empty. Hurray! 🎉';
})
.catch(error => {console.log(error)})
