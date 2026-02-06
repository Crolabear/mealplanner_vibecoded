// Get day from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const currentDay = urlParams.get('day') || 'monday';

// Load meal plan data
let mealPlan = {};
let foodDetails = {};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    displayDayTitle();
    displayMeals();
});

function displayDayTitle() {
    const title = document.getElementById('dayTitle');
    title.textContent = currentDay.charAt(0).toUpperCase() + currentDay.slice(1) + ' Meal Plan';
}

function loadData() {
    const savedPlan = localStorage.getItem('mealPlan');
    const savedDetails = localStorage.getItem('foodDetails');
    
    if (savedPlan) {
        mealPlan = JSON.parse(savedPlan);
    }
    
    if (savedDetails) {
        foodDetails = JSON.parse(savedDetails);
    }
}

function displayMeals() {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    
    meals.forEach(meal => {
        const listElement = document.getElementById(`${meal}-list`);
        listElement.innerHTML = '';
        
        if (mealPlan[currentDay] && mealPlan[currentDay][meal] && mealPlan[currentDay][meal].length > 0) {
            mealPlan[currentDay][meal].forEach((food, index) => {
                const foodElement = createFoodDetailElement(food, meal, index);
                listElement.appendChild(foodElement);
            });
        } else {
            listElement.innerHTML = '<p class="empty-message">No food planned for this meal</p>';
        }
    });
}

function createFoodDetailElement(food, meal, index) {
    const detailKey = `${currentDay}-${meal}-${index}`;
    const details = foodDetails[detailKey] || { link: '', notes: '' };
    
    const div = document.createElement('div');
    div.className = 'food-item-detail';
    
    div.innerHTML = `
        <div class="food-name">${food.name}</div>
        
        <div class="food-link-section">
            <label>Buy Online:</label>
            <input type="text" class="food-link" value="${details.link}" placeholder="Enter shopping link">
            ${details.link ? `<a href="${details.link}" target="_blank">Open Link →</a>` : ''}
        </div>
        
        <div class="food-notes-section">
            <label>Notes/Comments:</label>
            <textarea class="food-notes" placeholder="Add notes or comments...">${details.notes}</textarea>
        </div>
        
        <button class="save-btn">Save</button>
    `;
    
    const linkInput = div.querySelector('.food-link');
    const notesInput = div.querySelector('.food-notes');
    const saveBtn = div.querySelector('.save-btn');
    
    saveBtn.addEventListener('click', () => {
        saveFoodDetails(detailKey, linkInput.value, notesInput.value);
        displayMeals();
    });
    
    return div;
}

function saveFoodDetails(key, link, notes) {
    foodDetails[key] = { link, notes };
    localStorage.setItem('foodDetails', JSON.stringify(foodDetails));
}
