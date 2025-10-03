/**
 * Part 2: Algorithm Implementation
 */

/**
 * Problem 2-1: Sorting Algorithm (Quick Sort)
 * Sorts an array of recipes based on a specified key and order.
 * Note: Does not use the built-in Array.prototype.sort().
 *
 * @param {Array<Object>} recipes - The array of recipe objects to sort.
 * @param {string} orderBy - The key to sort by ('id', 'name', 'calories', 'cookingTime').
 * @param {string} order - The sort order ('asc' or 'desc').
 * @returns {Array<Object>} The sorted array of recipes.
 */
function customSort(recipes, orderBy, order) {
  if (!Array.isArray(recipes) || recipes.length <= 1) {
    return recipes;
  }

  const pivot = recipes[recipes.length - 1];
  const left = [];
  const right = [];

  for (let i = 0; i < recipes.length - 1; i++) {
    const a = recipes[i];
    const b = pivot;

    let aValue = a[orderBy];
    let bValue = b[orderBy];

    if (orderBy === 'calories' || orderBy === 'cookingTime') {
        aValue = a.nutrition[orderBy] ?? a[orderBy];
        bValue = b.nutrition[orderBy] ?? b[orderBy];
    }

    if (order === 'asc') {
      if (aValue < bValue) {
        left.push(a);
      } else {
        right.push(a);
      }
    } else { // desc
      if (aValue > bValue) {
        left.push(a);
      } else {
        right.push(a);
      }
    }
  }

  return [...customSort(left, orderBy, order), pivot, ...customSort(right, orderBy, order)];
}


/**
 * Problem 2-2: Knapsack Problem
 * Finds the combination of recipes that maximizes protein within calorie and cooking time constraints.
 *
 * @param {Array<Object>} recipes - The array of available recipes.
 * @param {number} maxCalories - The maximum allowed total calories.
 * @param {number} maxCookingTime - The maximum allowed total cooking time.
 * @returns {{selectedRecipeIds: Array<number>, totalProtein: number}} - The result.
 */
function solveKnapsack(recipes, maxCalories, maxCookingTime) {
    const n = recipes.length;
    // dp[i][c][t] will be the max protein for i items with c calories and t time
    const dp = Array(n + 1).fill(0).map(() => 
        Array(maxCalories + 1).fill(0).map(() => 
            Array(maxCookingTime + 1).fill(0)
        )
    );

    for (let i = 1; i <= n; i++) {
        const recipe = recipes[i - 1];
        const calories = recipe.nutrition.calories;
        const time = recipe.cookingTime;
        const protein = recipe.nutrition.protein;

        for (let c = 0; c <= maxCalories; c++) {
            for (let t = 0; t <= maxCookingTime; t++) {
                // If the current recipe is not included
                dp[i][c][t] = dp[i - 1][c][t];

                // If the current recipe can be included
                if (c >= calories && t >= time) {
                    dp[i][c][t] = Math.max(
                        dp[i][c][t],
                        dp[i - 1][c - calories][t - time] + protein
                    );
                }
            }
        }
    }

    const totalProtein = dp[n][maxCalories][maxCookingTime];
    let selectedRecipeIds = [];
    let c = maxCalories;
    let t = maxCookingTime;

    for (let i = n; i > 0 && totalProtein > 0; i--) {
        if (dp[i][c][t] !== dp[i - 1][c][t]) {
            const recipe = recipes[i - 1];
            selectedRecipeIds.push(recipe.id);
            c -= recipe.nutrition.calories;
            t -= recipe.cookingTime;
        }
    }

    return {
        selectedRecipeIds: selectedRecipeIds.reverse(),
        totalProtein: totalProtein
    };
}
