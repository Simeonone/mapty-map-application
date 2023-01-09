'use strict';

const form = document.querySelector('.form');
const containerActivities = document.querySelector('.activities');
const inputType = document.querySelector('.form__input--type');
const inputDescription = document.querySelector('.form__input--description');
const inputDuration = document.querySelector('.form__input--duration');
// let map, mapEvent;

class Activity {
  date = new Date();
  id = (Date.now() + '').slice(-11);
  clicks = 0;
  constructor(coords) {
    this.coords = coords;
  }
  _setSpecification() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.specification = `${this.description[0].toUpperCase()}${this.description.slice(
      1
    )} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} at ${new Intl.DateTimeFormat(navigator.language, {
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date())}`;
  }
  click() {
    this.clicks++;
  }
}
class subActivity extends Activity {
  constructor(coords, description, duration, type) {
    super(coords);
    this.type = type;
    this.description = description;
    this.duration = duration;
    this._setSpecification();
  }
}
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #allActivities = [];

  constructor() {
    //get user's position
    this._getPosition();
    //get data from local storage
    this._getLocalStorage();
    //attach event handlers
    form.addEventListener('submit', this._newActivity.bind(this));
    containerActivities.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      //the this keyword in a regular function call is set to undefined, as below- this._loadmap(this is set to undefined)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your position`);
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#allActivities.forEach(activity => {
      //   this._renderActivity(activity);
      this._renderActivityMarker(activity);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDescription.focus();
  }
  _hideForm() {
    //Empty inputs
    inputDuration.value = inputDescription.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(function () {
      return (form.style.display = 'grid'), 1000;
    });
  }
  _toggleElevationField() {}
  //newWorkout === newActivity
  _newActivity(e) {
    e.preventDefault();
    //Get data from form
    const type = inputType.value;
    const description = inputDescription.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    //Check if data is valid
    // //guard clause - below
    if (!(description.length > 0)) return alert(`Description cannot be empty`);
    if (!(duration > 0)) return alert(`Duration has to be greater than 0`);
    const subActivity1 = new subActivity(
      [lat, lng],
      description,
      duration,
      type
    );
    this.#allActivities.push(subActivity1);
    //Create subactivity object
    //Add new object to activity array
    //Render activity on map as marker
    this._renderActivityMarker(subActivity1);
    this._renderActivity(subActivity1);
    //render activity on list
    //hide form + clear input fields
    this._hideForm();
    //set local storage to all workouts
    this._setLocalStorage(this.#allActivities);
  }
  _renderActivityMarker(subActivity1) {
    L.marker(subActivity1.coords, {
      riseOnHover: true,
      riseOffset: 1000,
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${subActivity1.type}-popup`,
        })
      )
      .setPopupContent(
        `${subActivity1.specification} (${subActivity1.duration} min)`
      )
      .openPopup();
  }
  //before - .setPopupContent(
  // `${subActivity1.specification} (${subActivity1.duration} min)`
  // )
  _renderActivity(subActivity1) {
    //dom manipulation
    const html = `
    <li class="activity activity--${subActivity1.type}" data-id="${subActivity1.id}">
          <h2 class="h2cnt activity__title">
           ${subActivity1.specification}
          <button class="editBtn h2cnt innerbtn" type="button">Edit</button>
          <button class="innerbtn2" type="button">Submit</button>
          </h2>
          <div class="activity__details">
            <span class="activity__icon">Estimated time ⏱:</span>
            <span class="activity__value">${subActivity1.duration}
            </span>
            <span><input
            type="number"
            class="minEditor"
            placeholder="min"
          /></span>
            <span class="activity__unit">min</span>
            <span class="saveChanges">Save Changes</span>
            <div>
            <button class="deleteBtn" type="button">Delete</button></div>
          </div>
    `;
    form.insertAdjacentHTML('afterend', html);
    // location.reload();
    if (html) {
      document.querySelector('.sidebarMenuBtn').style.display = 'inline';
      document.querySelector('.sidebarMenuBtn2').style.display = 'inline';
      document.querySelector('.minEditor').style.display = 'none';
      document.querySelector('.innerbtn2').style.display = 'none';
    }
  }
  _moveToPopup(e) {
    //brings specific marker to focus
    const activityEl = e.target.closest('.activity');
    // if (activityEl) {
    const activity2 = this.#allActivities.findIndex(function (work) {
      return work.id === activityEl?.dataset.id;
    });
    // }
    //first headache - solved!
    if (e.target.querySelector('button')) {
      e.target.querySelector('.innerbtn').style.display = 'block';
      e.target.parentNode.querySelector('.deleteBtn').style.display = 'inline';
      e.target.parentNode
        .querySelector('.deleteBtn')
        .addEventListener('click', function () {
          const data2 = JSON.parse(localStorage.getItem('allActivities'));
          if (activity2 > -1) {
            data2.splice(activity2, 1);
          }
          localStorage.setItem('allActivities', JSON.stringify(data2));
          location.reload();
        });
    }
    if (e.target.querySelector('.innerbtn')) {
      e.target
        .querySelector('.innerbtn')
        .addEventListener('click', function () {
          e.target.parentNode.querySelector('.activity__value').style.display =
            'none';
          e.target.parentNode.querySelector('.minEditor').style.display = '';
          e.target.parentNode.querySelector('.innerbtn2').style.display =
            'block';
          e.target.parentNode.querySelector('.innerbtn').style.display = 'none';
          e.target.parentNode.querySelector('.activity__unit').style.display =
            'none';
        });
    }
    if (e.target.parentNode.querySelector('.innerbtn2')) {
      //   this.#allActivities[activity2].duration = +888;
      e.target.parentNode
        .querySelector('.innerbtn2')
        .addEventListener('click', function () {
          if (
            e.target.parentNode.querySelector('.minEditor') &&
            e.target.parentNode.querySelector('.minEditor').value > 0
          ) {
            e.target.parentNode.querySelector(
              '.activity__value'
            ).style.display = '';
            e.target.parentNode.querySelector('.minEditor').style.display =
              'none';
            e.target.parentNode.querySelector('.activity__unit').style.display =
              '';
            e.target.parentNode.querySelector('.saveChanges').style.display =
              'inline';
            // e.target.parentNode.querySelector('.deleteBtn').style.display =
            //   'inline';
            e.target.parentNode.querySelector('.innerbtn2').style.display =
              'none';
            e.target.parentNode.querySelector('.activity__value').textContent =
              e.target.parentNode.querySelector('.minEditor').value;
          }
        });
    }
    if (e.target.parentNode.querySelector('.activity__value')) {
      this.#allActivities[activity2].duration =
        +e.target.parentNode.querySelector('.activity__value').textContent;
      let totalArr = [];
      this.#allActivities.forEach(element => {
        totalArr.push(element.duration);
      });
      const totalSum = totalArr.reduce(function (accum, element) {
        return accum + element;
      }, 0);
      document.querySelector('.footerTxt').style.display = 'inline';
      document.querySelector('.totalMinutes').textContent = totalSum;
      const data = JSON.parse(localStorage.getItem('allActivities'));
      data.forEach(element => {
        if (e.target.parentNode.getAttribute('data-id') === element.id) {
          element.duration =
            +e.target.parentNode.querySelector('.activity__value').textContent;
        }
        this._setLocalStorage(this.#allActivities);
        // localStorage.setItem(
        //   'allActivities',
        //   JSON.stringify(this.#allActivities)
        // );
      });
      e.target.parentNode
        .querySelector('.saveChanges')
        .addEventListener('click', function () {
          e.target.parentNode.querySelector('.saveChanges').style.display =
            'none';
          location.reload();
        });
    }
    //guard clause-below
    if (!activityEl) return;
    const activity = this.#allActivities.find(
      //   work => work.id === activityEl.dataset.id
      function (work) {
        //below-check out mdn documentation for dataset.id
        return work.id === activityEl.dataset.id;
      }
    );
    this.#map.setView(activity.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
        // easeLinearity: 2,
      },
    });
    //interacting with the object using the public interface
    // activity.click();
  }

  _setLocalStorage(value) {
    //local storage API
    //activitys===allActivities
    //json.stringify converts all objects to strings
    localStorage.setItem('allActivities', JSON.stringify(value));
  }
  _getLocalStorage() {
    //json.parse converts all strings back to objects
    const data = JSON.parse(localStorage.getItem('allActivities'));
    //guard clause below
    if (!data) return;
    this.#allActivities = data;
    this.#allActivities.forEach(activity => this._renderActivity(activity));
  }

  reset() {
    localStorage.removeItem('allActivities');
    location.reload();
  }

  // addEventListener('submit', this._newActivity.bind(this));
}
const app = new App();
document.querySelector('.sidebarMenuBtn').addEventListener('click', app.reset);
document
  .querySelector('.sidebarMenuBtn2')
  .addEventListener('click', function () {
    document.querySelector('.modal').classList.remove('hiddenTutorial');
    document.querySelector('.overlay').classList.remove('hiddenTutorial');
    document.getElementById('map').style.display = 'none';
    //when close button is clicked
    document
      .querySelector('.close-modal')
      .addEventListener('click', function () {
        closeModal();
      });
    document.querySelector('.overlay').addEventListener('click', function () {
      closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  });
function closeModal() {
  document.querySelector('.overlay').classList.add('hiddenTutorial');
  document.getElementById('map').style.display = '';
  document.querySelector('.modal').classList.add('hiddenTutorial');
}
document.querySelector('.switch').addEventListener('click', function () {
  document.getElementById('map').style.display = 'inline';
  document.querySelector('.sidebar').style.display = 'none';
  document.querySelector('.switchToSideBar').style.display = 'inline';
});
document
  .querySelector('.switchToSideBar')
  .addEventListener('click', function () {
    document.querySelector('.sidebar').style.display = 'inline';
    document.querySelector('.switchToSideBar').style.display = 'none';
  });
