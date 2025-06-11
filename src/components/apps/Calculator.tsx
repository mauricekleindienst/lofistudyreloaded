"use client";
import { useState } from 'react';
import { Delete } from 'lucide-react';
import calculatorStyles from '../../../styles/Calculator.module.css';

const Calculator: React.FC = () => {  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '×': return firstValue * secondValue;
      case '÷': return firstValue / secondValue;
      default: return secondValue;
    }
  };
  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };
  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const deleteDigit = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const Button: React.FC<{ 
    onClick: () => void; 
    className?: string; 
    children: React.ReactNode;
  }> = ({ onClick, className = '', children }) => (
    <button
      onClick={onClick}
      className={`${calculatorStyles.button} ${className}`}
    >
      {children}
    </button>
  );  return (
    <div className={calculatorStyles.calculatorContainer}>
      {/* Display */}
      <div className={calculatorStyles.display}>
        <div className={calculatorStyles.displayText} style={{ textAlign: 'right' }}>
          {display}
        </div>
        {operation && (
          <div className={calculatorStyles.operationIndicator}>
            {operation}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className={calculatorStyles.buttonGrid}>
        <Button onClick={clear} className={calculatorStyles.clearButton}>
          Clear
        </Button>
        <Button onClick={deleteDigit} className={calculatorStyles.deleteButton}>
          <Delete size={16} />
        </Button>
        <Button onClick={() => inputOperation('÷')} className={`${calculatorStyles.operatorButton} ${operation === '÷' ? calculatorStyles.activeOperator : ''}`}>÷</Button>
        <Button onClick={() => inputOperation('×')} className={`${calculatorStyles.operatorButton} ${operation === '×' ? calculatorStyles.activeOperator : ''}`}>×</Button>
        
        <Button onClick={() => inputNumber('7')}>7</Button>
        <Button onClick={() => inputNumber('8')}>8</Button>
        <Button onClick={() => inputNumber('9')}>9</Button>
        <Button onClick={() => inputOperation('-')} className={`${calculatorStyles.operatorButton} ${operation === '-' ? calculatorStyles.activeOperator : ''}`}>-</Button>
        
        <Button onClick={() => inputNumber('4')}>4</Button>
        <Button onClick={() => inputNumber('5')}>5</Button>
        <Button onClick={() => inputNumber('6')}>6</Button>
        <Button onClick={() => inputOperation('+')} className={`${calculatorStyles.operatorButton} ${operation === '+' ? calculatorStyles.activeOperator : ''}`}>+</Button>
        
        <Button onClick={() => inputNumber('1')}>1</Button>
        <Button onClick={() => inputNumber('2')}>2</Button>
        <Button onClick={() => inputNumber('3')}>3</Button>
        <Button onClick={performCalculation} className={calculatorStyles.equalsButton}>
          =
        </Button>
        
        <Button onClick={() => inputNumber('0')} className={calculatorStyles.zeroButton}>0</Button>
        <Button onClick={() => inputNumber('.')}>.</Button>
      </div>
    </div>
  );
};

export default Calculator;
