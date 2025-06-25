"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, Clock, Edit2, Trash2 } from 'lucide-react';
import styles from '../../styles/Calendar.module.css';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService, Appointment } from '../lib/database';

interface CalendarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ isVisible, onClose }) => {
  const { user } = useAuth();
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

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setShowMonthSelector(false);
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setShowYearSelector(false);
  };

  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years;
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
      const dayAppointments = getAppointmentsForDay(day);
      const dateStr = formatDateString(day);
      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={day}
          className={`${styles.calendarDay} ${isToday(day) ? styles.today : ''} ${isSelected ? styles.selected : ''} ${dayAppointments.length > 0 ? styles.hasAppointments : ''}`}
          onClick={() => handleDayClick(day)}
        >
          <div className={styles.dayContent}>
            <span className={styles.dayNumber}>{day}</span>
            {dayAppointments.length > 0 && (
              <div className={styles.appointmentDots}>
                {dayAppointments.slice(0, 3).map((apt, index) => (
                  <div 
                    key={apt.id || index}
                    className={styles.appointmentDot}
                    style={{ backgroundColor: apt.color || categoryColors[apt.category || 'personal'] }}
                    title={apt.title}
                  />
                ))}
                {dayAppointments.length > 3 && (
                  <div className={`${styles.appointmentDot} ${styles.appointmentCounter}`} style={{ backgroundColor: '#666' }}>
                    +{dayAppointments.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const renderAppointmentForm = () => {
    if (!user) return null;

    return (
      <div className={styles.appointmentForm}>
        <h4>{editingAppointment ? 'Edit Appointment' : 'Add New Appointment'}</h4>
        
        <div className={styles.compactFormRow}>
          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="Appointment title *"
              value={newAppointment.title}
              onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <input
              type="time"
              value={newAppointment.time}
              onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
              className={styles.formInput}
              title="Time"
            />
          </div>
        </div>

        <div className={styles.compactFormRow}>
          <div className={styles.formGroup}>
            <select
              value={newAppointment.category}
              onChange={(e) => setNewAppointment({ ...newAppointment, category: e.target.value as 'personal' | 'work' | 'health' | 'study' | 'other' })}
              className={styles.formSelect}
            >
              <option value="personal">👤 Personal</option>
              <option value="work">💼 Work</option>
              <option value="health">💪 Health</option>
              <option value="study">📚 Study</option>
              <option value="other">📝 Other</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <div className={styles.compactColorPicker}>
              <input
                type="color"
                value={newAppointment.color}
                onChange={(e) => setNewAppointment({ ...newAppointment, color: e.target.value })}
                className={styles.colorInput}
                title="Color"
              />
              <div className={styles.colorPresets}>
                {Object.entries(categoryColors).map(([category, color]) => (
                  <button
                    key={category}
                    type="button"
                    className={`${styles.colorPreset} ${newAppointment.color === color ? styles.activePreset : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewAppointment({ ...newAppointment, color })}
                    title={`${category} color`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <textarea
            placeholder="Description (optional)"
            value={newAppointment.description}
            onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
            className={styles.formTextarea}
            rows={2}
          />
        </div>

        <div className={styles.formOptionsRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={newAppointment.reminder}
              onChange={(e) => setNewAppointment({ ...newAppointment, reminder: e.target.checked })}
            />
            <span className={styles.checkboxText}>Enable reminder</span>
          </label>
        </div>

        <div className={styles.formActions}>
          <button
            onClick={editingAppointment ? handleUpdateAppointment : handleAddAppointment}
            disabled={loading || !newAppointment.title.trim()}
            className={styles.saveButton}
          >
            {loading ? 'Saving...' : editingAppointment ? 'Update' : 'Add'}
          </button>
          
          <button
            onClick={() => {
              setShowAddForm(false);
              setEditingAppointment(null);
              resetForm();
            }}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.calendarOverlay} onClick={onClose}>
      <div className={styles.calendarContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.calendarMainContent}>
          {/* Calendar Header */}
          <div className={styles.calendarHeader}>
            <div className={styles.monthNavigation}>
              <button 
                onClick={() => navigateMonth('prev')}
                className={styles.navButton}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className={styles.dateSelectors}>
                <div className={styles.monthSelector}>
                  <button 
                    className={styles.monthYearButton}
                    onClick={() => {
                      setShowMonthSelector(!showMonthSelector);
                      setShowYearSelector(false);
                    }}
                  >
                    {monthNames[currentDate.getMonth()]}
                  </button>
                  {showMonthSelector && (
                    <div className={styles.selectorDropdown}>
                      {monthNames.map((month, index) => (
                        <button
                          key={month}
                          className={`${styles.selectorOption} ${index === currentDate.getMonth() ? styles.selectedOption : ''}`}
                          onClick={() => handleMonthSelect(index)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className={styles.yearSelector}>
                  <button 
                    className={styles.monthYearButton}
                    onClick={() => {
                      setShowYearSelector(!showYearSelector);
                      setShowMonthSelector(false);
                    }}
                  >
                    {currentDate.getFullYear()}
                  </button>
                  {showYearSelector && (
                    <div className={styles.selectorDropdown}>
                      {generateYearRange().map((year) => (
                        <button
                          key={year}
                          className={`${styles.selectorOption} ${year === currentDate.getFullYear() ? styles.selectedOption : ''}`}
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
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

          {/* Selected Date Actions */}
          {selectedDate && user && (
            <div className={styles.selectedDateActions}>
              <div className={styles.selectedDateInfo}>
                <span>Selected: {new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              {!showAddForm && !editingAppointment && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className={styles.addAppointmentButton}
                >
                  <Plus size={16} />
                  Add Appointment
                </button>
              )}
            </div>
          )}

          {/* Appointment Form */}
          {(showAddForm || editingAppointment) && renderAppointmentForm()}

          {/* Today Info */}
          <div className={styles.calendarFooter}>
            <div className={styles.todayInfo}>
              <div className={styles.todayBadge}>
                <span className={styles.todayLabel}>Today</span>
                <div className={styles.todayDetails}>
                  <span className={styles.todayDay}>{today.getDate()}</span>
                  <div className={styles.todayDateText}>
                    <span className={styles.todayWeekday}>
                      {today.toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                    <span className={styles.todayDate}>
                      {today.toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Overview Panel */}
        <div className={styles.appointmentsPanel}>
          {user ? (
            <>
              <div className={styles.appointmentsPanelHeader}>
                <h4>
                  {selectedDate 
                    ? `${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Appointments` 
                    : 'All Appointments'
                  }
                </h4>
                <div className={styles.headerActions}>
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate(null)}
                      className={styles.clearFilterButton}
                      title="Show all appointments"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
            {!selectedDate && appointments.length > 0 && (
              <div className={styles.quickStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{appointments.length}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>
                    {appointments.filter(apt => apt.date === formatDateString(today.getDate())).length}
                  </span>
                  <span className={styles.statLabel}>Today</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>
                    {appointments.filter(apt => new Date(apt.date) > today).length}
                  </span>
                  <span className={styles.statLabel}>Upcoming</span>
                </div>
              </div>
            )}
            
            <div className={styles.appointmentsList}>
              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingSpinner}></div>
                  Loading appointments...
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <div className={styles.emptyTitle}>
                    {selectedDate ? 'No appointments for this day' : 'No appointments yet'}
                  </div>
                  <div className={styles.emptyDescription}>
                    {selectedDate 
                      ? 'Click "Add Appointment" to schedule something for this date.'
                      : 'Start by selecting a date and adding your first appointment.'
                    }
                  </div>
                </div>
              ) : (
                filteredAppointments
                  .sort((a, b) => {
                    // Sort by date first, then by time
                    const dateCompare = a.date.localeCompare(b.date);
                    if (dateCompare !== 0) return dateCompare;
                    
                    const timeA = a.time || '23:59';
                    const timeB = b.time || '23:59';
                    return timeA.localeCompare(timeB);
                  })
                  .map((appointment) => (
                    <div key={appointment.id} className={styles.appointmentItem}>
                      <div 
                        className={styles.appointmentColor} 
                        style={{ backgroundColor: appointment.color || categoryColors[appointment.category || 'personal'] }}
                      />
                      <div className={styles.appointmentDetails}>
                        <div className={styles.appointmentTitle}>{appointment.title}</div>
                        <div className={styles.appointmentMeta}>
                          {appointment.time && (
                            <div className={styles.appointmentTime}>
                              <Clock size={12} />
                              {appointment.time}
                            </div>
                          )}
                          <div className={styles.appointmentCategory}>
                            {appointment.category === 'personal' && '👤'}
                            {appointment.category === 'work' && '💼'}
                            {appointment.category === 'health' && '💪'}
                            {appointment.category === 'study' && '�'}
                            {appointment.category === 'other' && '�'}
                            {appointment.category || 'personal'}
                          </div>
                          {appointment.reminder && (
                            <div className={styles.reminderBadge} title="Reminder enabled">
                              �
                            </div>
                          )}
                        </div>
                        {appointment.description && (
                          <div className={styles.appointmentDescription}>
                            {appointment.description}
                          </div>
                        )}
                      </div>
                      <div className={styles.appointmentActions}>
                        <button
                          onClick={() => startEditing(appointment)}
                          className={styles.editButton}
                          title="Edit appointment"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(appointment.id!)}
                          className={styles.deleteButton}
                          title="Delete appointment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>                  ))
                )}
              </div>
            </>
          ) : (
            <div className={styles.loginPrompt}>
              <div className={styles.loginPromptIcon}>🔐</div>
              <div className={styles.loginPromptTitle}>Sign in to manage appointments</div>
              <div className={styles.loginPromptDescription}>
                Create an account or sign in to add, edit, and manage your appointments. Your data will be securely stored and synced across devices.
              </div>
              <div className={styles.loginPromptFeatures}>
                <div className={styles.featureItem}>✓ Secure cloud storage</div>
                <div className={styles.featureItem}>✓ Multi-device sync</div>
                <div className={styles.featureItem}>✓ Reminder notifications</div>
                <div className={styles.featureItem}>✓ Color-coded categories</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
