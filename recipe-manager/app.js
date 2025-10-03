document.addEventListener('DOMContentLoaded', () => {
    // Global state
    let allRecipes = [];

    // --- UI Elements ---
    const recipeListContainer = document.getElementById('recipe-list');
    const knapsackForm = document.getElementById('knapsack-form');
    const knapsackResultContainer = document.getElementById('knapsack-result');
    const modal = document.getElementById('recipe-modal');
    const recipeForm = document.getElementById('recipe-form');
    const modalTitle = document.getElementById('modal-title');
    const ingredientsContainer = document.getElementById('ingredients-container');
    const stepsContainer = document.getElementById('steps-container');
    const saveButton = document.getElementById('save-recipe');

    const numericFields = [
        'recipe-servings', 'recipe-cookingTime',
        'recipe-calories', 'recipe-protein', 'recipe-fat', 'recipe-carbohydrates'
    ];

    // --- 1. Data Management ---

    async function loadRecipes() {
        const storedRecipes = localStorage.getItem('recipes');
        if (storedRecipes) {
            allRecipes = JSON.parse(storedRecipes);
        } else {
            try {
                const response = await fetch('recipes.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allRecipes = await response.json();
                saveRecipes();
            } catch (error) {
                recipeListContainer.innerHTML = '<p>レシピの読み込みに失敗しました。</p>';
                console.error('Fetch error:', error);
            }
        }
        renderRecipes(allRecipes);
    }

    function saveRecipes() {
        localStorage.setItem('recipes', JSON.stringify(allRecipes));
    }

    // --- 2. Rendering ---

    function renderRecipes(recipesToRender) {
        recipeListContainer.innerHTML = '';
        recipesToRender.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.dataset.id = recipe.id;

            const ingredientsList = recipe.ingredients.map(ing => {
                const amount = ing.amount !== null ? ing.amount : '';
                let text;
                if (ing.unit === '大さじ') {
                    text = `${ing.unit}${amount}`;
                } else {
                    text = `${amount}${ing.unit}`;
                }
                return `<li>${ing.name}: ${text.trim()}</li>`;
            }).join('');

            const stepsList = recipe.steps.map(step => `<li>${step}</li>`).join('');

            card.innerHTML = `
                <div class="recipe-card-content">
                    <h3>${recipe.name}</h3>
                    <p>${recipe.description}</p>
                    <div class="recipe-meta">
                        <p><strong>カテゴリ:</strong> ${recipe.category}</p>
                        <p><strong>分量:</strong> ${recipe.servings} 人分</p>
                        <p><strong>調理時間:</strong> ${recipe.cookingTime}分</p>
                    </div>
                    <div class="recipe-nutrition">
                        <p><strong>カロリー:</strong> ${recipe.nutrition.calories} kcal</p>
                        <p><strong>タンパク質:</strong> ${recipe.nutrition.protein} g</p>
                        <p><strong>脂質:</strong> ${recipe.nutrition.fat} g</p>
                        <p><strong>炭水化物:</strong> ${recipe.nutrition.carbohydrates} g</p>
                    </div>
                    <details>
                        <summary><strong>材料</strong></summary>
                        <ul>${ingredientsList}</ul>
                    </details>
                    <details>
                        <summary><strong>調理手順</strong></summary>
                        <ol>${stepsList}</ol>
                    </details>
                </div>
                <div class="recipe-card-actions">
                    <button class="btn-edit">編集</button>
                    <button class="btn-delete">削除</button>
                </div>
            `;
            recipeListContainer.appendChild(card);
        });
    }

    // --- 3. Validation ---

    function validateNumericInput(input) {
        const errorMessageDiv = input.nextElementSibling;
        const value = input.value;
        // Allow empty value or half-width numbers only
        const isValid = value === '' || /^[0-9]+$/.test(value);

        if (!isValid) {
            input.classList.add('invalid');
            errorMessageDiv.textContent = '半角数字で入力してください';
        } else {
            input.classList.remove('invalid');
            errorMessageDiv.textContent = '';
        }
        checkFormValidity();
    }

    function checkFormValidity() {
        const hasInvalidInput = recipeForm.querySelector('input.invalid');
        saveButton.disabled = !!hasInvalidInput;
    }

    function clearAllValidation() {
        recipeForm.querySelectorAll('input.invalid').forEach(input => {
            input.classList.remove('invalid');
            const errorMessageDiv = input.nextElementSibling;
            if (errorMessageDiv && errorMessageDiv.classList.contains('error-message')) {
                errorMessageDiv.textContent = '';
            }
        });
        checkFormValidity();
    }

    // --- 4. CRUD & Modal Logic ---

    function openModal(recipeId = null) {
        recipeForm.reset();
        ingredientsContainer.innerHTML = '';
        stepsContainer.innerHTML = '';
        clearAllValidation();

        if (recipeId) {
            const recipe = allRecipes.find(r => r.id == recipeId);
            if (!recipe) return;

            modalTitle.textContent = 'レシピの編集';
            document.getElementById('recipe-id').value = recipe.id;
            document.getElementById('recipe-name').value = recipe.name;
            document.getElementById('recipe-description').value = recipe.description;
            document.getElementById('recipe-servings').value = recipe.servings;
            document.getElementById('recipe-cookingTime').value = recipe.cookingTime;
            document.getElementById('recipe-category').value = recipe.category;
            document.getElementById('recipe-calories').value = recipe.nutrition.calories;
            document.getElementById('recipe-protein').value = recipe.nutrition.protein;
            document.getElementById('recipe-fat').value = recipe.nutrition.fat;
            document.getElementById('recipe-carbohydrates').value = recipe.nutrition.carbohydrates;

            recipe.ingredients.forEach(addIngredientInput);
            recipe.steps.forEach(addStepInput);
        } else {
            modalTitle.textContent = '新しいレシピを追加';
            document.getElementById('recipe-id').value = '';
            addIngredientInput();
            addStepInput();
        }
        modal.style.display = 'flex';
        checkFormValidity(); // Check validity on open
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        if (saveButton.disabled) return; // Prevent submission if form is invalid

        const id = document.getElementById('recipe-id').value;

        const ingredients = Array.from(ingredientsContainer.querySelectorAll('.dynamic-item')).map(item => ({
            name: item.querySelector('.ingredient-name').value,
            amount: parseFloat(item.querySelector('.ingredient-amount').value) || null,
            unit: item.querySelector('.ingredient-unit').value,
        })).filter(ing => ing.name);

        const steps = Array.from(stepsContainer.querySelectorAll('.dynamic-item input')).map(input => input.value).filter(step => step);

        const recipeData = {
            id: id ? parseInt(id) : Date.now(),
            name: document.getElementById('recipe-name').value,
            description: document.getElementById('recipe-description').value,
            servings: parseInt(document.getElementById('recipe-servings').value),
            cookingTime: parseInt(document.getElementById('recipe-cookingTime').value),
            category: document.getElementById('recipe-category').value,
            nutrition: {
                calories: parseInt(document.getElementById('recipe-calories').value),
                protein: parseInt(document.getElementById('recipe-protein').value),
                fat: parseInt(document.getElementById('recipe-fat').value),
                carbohydrates: parseInt(document.getElementById('recipe-carbohydrates').value),
            },
            ingredients: ingredients,
            steps: steps,
        };

        if (id) {
            const index = allRecipes.findIndex(r => r.id == id);
            if (index !== -1) allRecipes[index] = recipeData;
        } else {
            allRecipes.push(recipeData);
        }

        saveRecipes();
        renderRecipes(allRecipes);
        closeModal();
    }

    function addIngredientInput(ingredient = { name: '', amount: '', unit: '' }) {
        const div = document.createElement('div');
        div.className = 'dynamic-item';
        div.innerHTML = `
            <div class="dynamic-item-inputs">
                <div class="form-group">
                    <input type="text" class="ingredient-name" placeholder="材料名" value="${ingredient.name}">
                </div>
                <div class="form-group">
                    <input type="text" class="ingredient-amount" placeholder="量" value="${ingredient.amount ?? ''}">
                    <div class="error-message"></div>
                </div>
                <div class="form-group">
                    <input type="text" class="ingredient-unit" placeholder="単位 (g, 個など)" value="${ingredient.unit ?? ''}">
                </div>
            </div>
            <button type="button" class="btn-delete">削除</button>
        `;
        ingredientsContainer.appendChild(div);
        const amountInput = div.querySelector('.ingredient-amount');
        amountInput.addEventListener('input', () => validateNumericInput(amountInput));
        div.querySelector('.btn-delete').addEventListener('click', () => {
            div.remove();
            checkFormValidity(); // Re-check validity after removing an item
        });
    }

    function addStepInput(step = '') {
        const div = document.createElement('div');
        div.className = 'dynamic-item';
        div.innerHTML = `
            <div class="dynamic-item-inputs">
                <input type="text" placeholder="手順" value="${step}">
            </div>
            <button type="button" class="btn-delete">削除</button>
        `;
        stepsContainer.appendChild(div);
        div.querySelector('.btn-delete').addEventListener('click', () => div.remove());
    }

    // --- 5. Event Listeners ---

    function setupEventListeners() {
        // Validation listeners
        numericFields.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            input.addEventListener('input', () => validateNumericInput(input));
        });

        // Sort buttons
        const sortButtons = {
            'sort-id-asc': { key: 'id', order: 'asc' },
            'sort-name-asc': { key: 'name', order: 'asc' },
            'sort-calories-asc': { key: 'calories', order: 'asc' },
            'sort-cookingTime-asc': { key: 'cookingTime', order: 'asc' },
        };
        for (const [buttonId, { key, order }] of Object.entries(sortButtons)) {
            document.getElementById(buttonId)?.addEventListener('click', () => {
                const sortedRecipes = customSort([...allRecipes], key, order);
                renderRecipes(sortedRecipes);
            });
        }

        // Knapsack form
        knapsackForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const maxCalories = parseInt(document.getElementById('maxCalories').value, 10);
            const maxCookingTime = parseInt(document.getElementById('maxCookingTime').value, 10);
            if (isNaN(maxCalories) || isNaN(maxCookingTime)) return;

            const result = solveKnapsack(allRecipes, maxCalories, maxCookingTime);
            displayKnapsackResult(result, maxCalories, maxCookingTime);
        });

        // CRUD buttons
        document.getElementById('add-new-recipe').addEventListener('click', () => openModal());

        recipeListContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.recipe-card');
            if (!card) return;
            const recipeId = card.dataset.id;

            if (e.target.classList.contains('btn-edit')) {
                openModal(recipeId);
            }
            if (e.target.classList.contains('btn-delete')) {
                if (confirm('このレシピを本当に削除しますか？')) {
                    allRecipes = allRecipes.filter(r => r.id != recipeId);
                    saveRecipes();
                    renderRecipes(allRecipes);
                }
            }
        });

        // Modal events
        recipeForm.addEventListener('submit', handleFormSubmit);
        document.getElementById('cancel-edit').addEventListener('click', closeModal);
        document.getElementById('add-ingredient').addEventListener('click', () => addIngredientInput());
        document.getElementById('add-step').addEventListener('click', () => addStepInput());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function displayKnapsackResult(result, maxCalories, maxCookingTime) {
        knapsackResultContainer.innerHTML = '';
        let content = `<h4>計算結果</h4><p><strong>上限:</strong> ${maxCalories} kcal, ${maxCookingTime} 分</p>`;
        if (result.selectedRecipeIds.length > 0) {
            const selectedRecipes = result.selectedRecipeIds.map(id => allRecipes.find(r => r.id === id));
            const totalCalories = selectedRecipes.reduce((sum, r) => sum + r.nutrition.calories, 0);
            const totalTime = selectedRecipes.reduce((sum, r) => sum + r.cookingTime, 0);

            content += `<p><strong>最大タンパク質量:</strong> ${result.totalProtein.toFixed(2)} g</p>`;
            content += `<p><strong>合計カロリー:</strong> ${totalCalories} kcal</p>`;
            content += `<p><strong>合計調理時間:</strong> ${totalTime} 分</p>`;
            content += `<p><strong>選択されたレシピ:</strong></p><ul>`;
            selectedRecipes.forEach(r => { content += `<li>${r.name} (ID: ${r.id})</li>`; });
            content += `</ul>`;
        } else {
            content += `<p>条件に合うレシピの組み合わせは見つかりませんでした。</p>`;
        }
        knapsackResultContainer.innerHTML = content;
    }

    // --- Initial Load ---
    loadRecipes();
    setupEventListeners();
});