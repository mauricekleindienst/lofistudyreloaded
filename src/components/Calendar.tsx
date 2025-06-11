"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from '../../styles/Calendar.module.css';

interface CalendarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ isVisible, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = new Date();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  if (!isVisible) return null;

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div
          key={day}
          className={`${styles.calendarDay} ${isToday(day) ? styles.today : ''}`}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className={styles.calendarOverlay} onClick={onClose}>
      <div className={styles.calendarContainer} onClick={(e) => e.stopPropagation()}>
        {/* Calendar Header */}
        <div className={styles.calendarHeader}>
          <div className={styles.monthNavigation}>
            <button 
              onClick={() => navigateMonth('prev')}
              className={styles.navButton}
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className={styles.monthTitle}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button 
              onClick={() => navigateMonth('next')}
              className={styles.navButton}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={18} />
          </button>
        </div>

        {/* Day Names */}
        <div className={styles.dayNames}>
          {dayNames.map(dayName => (
            <div key={dayName} className={styles.dayName}>
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={styles.calendarGrid}>
          {renderCalendarDays()}
        </div>

        {/* Today Info */}
        <div className={styles.calendarFooter}>
          <div className={styles.todayInfo}>
            <span className={styles.todayLabel}>Today:</span>
            <span className={styles.todayDate}>
              {today.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
