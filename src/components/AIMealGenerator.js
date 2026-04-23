import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AIMealGenerator({ onClose }) {
  const [children, setChildren] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedMeals, setGeneratedMeals] = useState([]);
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [mealsPerDay, setMealsPerDay] = useState(3);

  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  useEffect(() => {
    fetchChildrenAndAllergies();
  }, []);

  const fetchChildrenAndAllergies = async () => {
    const { data } = await supabase.from('children').select('*');
    setChildren(data || []);

    const allergyMap = {};
    data?.forEach(child => {
      if (child.allergies) {
        child.allergies.split(',').forEach(allergy => {
          const trimmed = allergy.trim();
          if (trimmed && trimmed !== 'None') {
            allergyMap[trimmed] = (allergyMap[trimmed] || 0) + 1;
          }
        });
      }
    });

    const allergyList = Object.entries(allergyMap).map(([name, count]) => ({ name, count }));
    setAllergies(allergyList);
  };

  const generateMealPlan = async () => {
    if (!GEMINI_API_KEY) {
      alert('Please add your Gemini API key to the .env file!');
      return;
    }

    setLoading(true);

    const allergyInfo = allergies.length > 0
      ? allergies.map(a => `${a.name} (${a.count} children)`).join(', ')
      : 'No allergies';

    const prompt = `You are a professional kindergarten chef creating meal plans for ${children.length} children.

CRITICAL ALLERGY INFORMATION:
${allergyInfo}

REQUIREMENTS:
- Generate ${mealsPerDay} meals for each of these days: ${selectedDays.join(', ')}
- Each meal must be COMPLETELY FREE from: ${allergies.map(a => a.name).join(', ')}
- Meals should be nutritious, age-appropriate (3-5 years old), and easy to prepare
- Include variety (different proteins, vegetables, grains)

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (JSON array):
[
  {
    "day": "Monday",
    "meal_name": "Chicken and Rice Bowl",
    "meal_type": "Lunch",
    "ingredients": "grilled chicken breast, white rice, steamed carrots, olive oil",
    "allergen_info": "dairy-free, gluten-free, nut-free, egg-free"
  }
]

Generate ${selectedDays.length * mealsPerDay} meals total. Return ONLY the JSON array, no other text.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        let aiResponse = data.candidates[0].content.parts[0].text;
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const meals = JSON.parse(aiResponse);
        setGeneratedMeals(meals);
      } else {
        alert('Failed to generate meals. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating meal plan. Check your API key and try again.');
    }

    setLoading(false);
  };

  const saveMealPlan = async () => {
    const mealsToSave = generatedMeals.map(meal => ({
      meal_name: meal.meal_name,
      meal_type: meal.meal_type,
      ingredients: meal.ingredients,
      allergen_info: meal.allergen_info,
      generated_by_ai: true,
      date_created: new Date().toISOString().split('T')[0]
    }));

    const { error } = await supabase.from('meals').insert(mealsToSave);

    if (error) {
      alert('Error saving meals: ' + error.message);
    } else {
      alert('Meal plan saved successfully! ✅');
      onClose();
    }
  };

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">🤖 AI Meal Plan Generator</h2>
              <p className="text-gray-500 text-sm mt-1">Powered by Google Gemini</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-2">⚠️ Allergies to Avoid ({children.length} children)</h3>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allergies.map(({ name, count }) => (
                  <span key={name} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {name} ({count} {count === 1 ? 'child' : 'children'})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No allergies recorded ✅</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-3">Select Days:</label>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    selectedDays.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Meals per day:</label>
            <select
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 meal</option>
              <option value={2}>2 meals</option>
              <option value={3}>3 meals</option>
              <option value={4}>4 meals</option>
              <option value={5}>5 meals</option>
            </select>
          </div>

          {generatedMeals.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-4">Generated Meal Plan:</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {generatedMeals.map((meal, index) => (
                  <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-green-800">{meal.day}</span>
                      <span className="text-sm text-gray-600">{meal.meal_type}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">{meal.meal_name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Ingredients:</strong> {meal.ingredients}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {meal.allergen_info.split(',').map((info, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          ✓ {info.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            {generatedMeals.length === 0 ? (
              <button
                onClick={generateMealPlan}
                disabled={loading || selectedDays.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
              >
                {loading ? '🤖 AI is thinking...' : '✨ Generate Meal Plan with AI'}
              </button>
            ) : (
              <>
                <button onClick={() => setGeneratedMeals([])} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">
                  ↺ Generate Again
                </button>
                <button onClick={saveMealPlan} className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600">
                  ✓ Save Meal Plan
                </button>
              </>
            )}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> AI analyzes all children's allergies and generates safe, nutritious meals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIMealGenerator;