/**
 * Counter - A simple component demonstrating useState
 *
 * useState Hook Explained:
 * ========================
 *
 * const [value, setValue] = useState(initialValue)
 *
 * Returns an array with exactly 2 elements:
 * 1. The current value
 * 2. A function to update the value
 *
 * When you call setValue(newValue):
 * - React schedules a re-render
 * - The component function runs again
 * - useState returns the NEW value
 * - The UI updates to show the new value
 *
 * Rules of Hooks:
 * 1. Only call hooks at the top level (not in loops, conditions, or nested functions)
 * 2. Only call hooks from React function components (or custom hooks)
 */

import { useState } from 'react'

function Counter() {
  // Declare a state variable called "count", initialized to 0
  // TypeScript infers the type as number from the initial value
  const [count, setCount] = useState(0)

  // You can have multiple state variables
  const [step, setStep] = useState(1)

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Counter Demo</h3>

      <p className="text-3xl font-bold text-center mb-4">{count}</p>

      <div className="flex gap-2 justify-center mb-4">
        {/* onClick receives a function, not a function call */}
        {/* Wrong: onClick={setCount(count - step)} - this runs immediately! */}
        {/* Right: onClick={() => setCount(count - step)} - this runs on click */}
        <button
          onClick={() => setCount(count - step)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          - {step}
        </button>

        <button
          onClick={() => setCount(count + step)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          + {step}
        </button>
      </div>

      <div className="flex gap-2 justify-center items-center">
        <span className="text-sm text-gray-600">Step:</span>
        {[1, 5, 10].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`px-3 py-1 rounded ${
              step === s
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Reset button - you can set state to any value */}
      <button
        onClick={() => setCount(0)}
        className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Reset
      </button>
    </div>
  )
}

export default Counter
