document.addEventListener('DOMContentLoaded', () => {
    const recipeListContainer = document.getElementById('recipe-list');
    const knapsackForm = document.getElementById('knapsack-form');
    const knapsackResultContainer = document.getElementById('knapsack-result');
    let recipes = [];

    // Fetch recipe data
    async function loadRecipes() {
        try {
            const response = await fetch('recipes.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            recipes = await response.json();
            renderRecipes(recipes);
        } catch (error) {
            recipeListContainer.innerHTML = '<p>レシピの読み込みに失敗しました。</p>';
            console.error('Fetch error:', error);
        }
    }

    // Render recipes to the DOM
    function renderRecipes(recipesToRender) {
        recipeListContainer.innerHTML = '';
        recipesToRender.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';

            // Create ingredients list with corrected order for specific units
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

            // Create steps list
            const stepsList = recipe.steps.map(step => `<li>${step}</li>`).join('');

            card.innerHTML = `
                <h3>${recipe.name} (ID: ${recipe.id})</h3>
                <p><strong>カテゴリ:</strong> ${recipe.category}</p>
                <p><strong>分量:</strong> ${recipe.servings} 人分</p>
                <p><strong>調理時間:</strong> ${recipe.cookingTime}分</p>
                <p><strong>カロリー:</strong> ${recipe.nutrition.calories} kcal</p>
                <p><strong>タンパク質:</strong> ${recipe.nutrition.protein} g</p>
                <p>${recipe.description}</p>
                <strong>材料:</strong>
                <ul>
                    ${ingredientsList}
                </ul>
                <strong>調理手順:</strong>
                <ol>
                    ${stepsList}
                </ol>
            `;
            recipeListContainer.appendChild(card);
        });
    }

    // --- Event Listeners for Sorting (Part 2-1) ---
    function addSortListeners() {
        const sortButtons = {
            'sort-id-asc': { key: 'id', order: 'asc' },
            'sort-name-asc': { key: 'name', order: 'asc' },
            'sort-calories-asc': { key: 'calories', order: 'asc' },
            'sort-cookingTime-asc': { key: 'cookingTime', order: 'asc' },
        };

        for (const [buttonId, { key, order }] of Object.entries(sortButtons)) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    const sortedRecipes = customSort([...recipes], key, order);
                    renderRecipes(sortedRecipes);
                });
            }
        }
    }

    // --- Event Listener for Knapsack (Part 2-2) ---
    if (knapsackForm) {
        knapsackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const maxCalories = parseInt(document.getElementById('maxCalories').value, 10);
            const maxCookingTime = parseInt(document.getElementById('maxCookingTime').value, 10);

            if (isNaN(maxCalories) || isNaN(maxCookingTime)) {
                knapsackResultContainer.innerHTML = '<p>有効な数値を入力してください。</p>';
                return;
            }

            const result = solveKnapsack(recipes, maxCalories, maxCookingTime);
            displayKnapsackResult(result, maxCalories, maxCookingTime);
        });
    }

    function displayKnapsackResult(result, maxCalories, maxCookingTime) {
        knapsackResultContainer.innerHTML = '';
        let content = `<h4>計算結果</h4>`;
        content += `<p><strong>上限:</strong> ${maxCalories} kcal, ${maxCookingTime} 分</p>`;

        if (result.selectedRecipeIds.length > 0) {
            const selectedRecipes = result.selectedRecipeIds.map(id => recipes.find(r => r.id === id));
            const totalCalories = selectedRecipes.reduce((sum, r) => sum + r.nutrition.calories, 0);
            const totalTime = selectedRecipes.reduce((sum, r) => sum + r.cookingTime, 0);

            content += `<p><strong>最大タンパク質量:</strong> ${result.totalProtein.toFixed(2)} g</p>`;
            content += `<p><strong>合計カロリー:</strong> ${totalCalories} kcal</p>`;
            content += `<p><strong>合計調理時間:</strong> ${totalTime} 分</p>`;
            content += `<p><strong>選択されたレシピ:</strong></p><ul>`;
            selectedRecipes.forEach(r => {
                content += `<li>${r.name} (ID: ${r.id})</li>`;
            });
            content += `</ul>`;
        } else {
            content += `<p>条件に合うレシピの組み合わせは見つかりませんでした。</p>`;
        }
        knapsackResultContainer.innerHTML = content;
    }

    // Initial load
    loadRecipes();
    addSortListeners();
});
