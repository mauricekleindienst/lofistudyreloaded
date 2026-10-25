"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, Clock, Edit2, Trash2 } from 'lucide-react';
import styles from '../../styles/Calendar.module.css';
import { useAuth } from '../contexts/AuthContext';
import { db, type Appointment } from '../lib/database';
import { localDate } from '../lib/api';

// 'YYYY-MM-DD' parsed by new Date() is UTC midnight, i.e. the previous day west of Greenwich.
const parseLocalDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

interface CalendarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ isVisible, onClose }) => {
  const { user, loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  
  // Form state
  const [newAppointment, setNewAppointment] = useState<{
    title: string;
    description: string;
    time: string;
    color: string;
    category: 'personal' | 'work' | 'health' | 'study' | 'other';
    reminder: boolean;
  }>({
    title: '',
    description: '',
    time: '',
    color: '#ff7b00',
    category: 'personal',
    reminder: false
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = new Date();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const categoryColors = {
    personal: '#ff7b00',
    work: '#3b82f6',
    health: '#ef4444',
    study: '#8b5cf6',
    other: '#10b981'
  };

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setAppointments(await db.getAppointments());
    setLoading(false);
  }, []);

  // Load appointments when opened and whenever the user signs in or out
  useEffect(() => {
    if (isVisible && !authLoading) {
      loadAppointments();
    }
  }, [isVisible, user?.id, authLoading, loadAppointments]);

  // Filter appointments when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const filtered = appointments.filter(apt => apt.date === selectedDate);
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments(appointments);
    }
  }, [selectedDate, appointments]);

  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, onClose]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.monthSelector}`) && !target.closest(`.${styles.yearSelector}`)) {
        setShowMonthSelector(false);
        setShowYearSelector(false);
      }
    };

    if (showMonthSelector || showYearSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMonthSelector, showYearSelector]);

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

  const formatDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getAppointmentsForDay = (day: number) => {
    const dateStr = formatDateString(day);
    return appointments.filter(apt => apt.date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDateString(day);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
    setShowAddForm(false);
    setEditingAppointment(null);
  };

  const handleAddAppointment = async () => {
    if (!selectedDate || !newAppointment.title.trim()) return;

    setLoading(true);
    try {
      const appointmentData = {
        title: newAppointment.title,
        description: newAppointment.description,
        date: selectedDate,
        time: newAppointment.time,
        color: newAppointment.color,
        category: newAppointment.category,
        reminder: newAppointment.reminder
      };

      const savedAppointment = await db.saveAppointment(appointmentData);
      if (savedAppointment) {
        setAppointments(prev => [...prev, savedAppointment]);
        resetForm();
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to save appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !newAppointment.title.trim()) return;

    setLoading(true);
    try {
      const updates = {
        title: newAppointment.title,
        description: newAppointment.description,
        time: newAppointment.time,
        color: newAppointment.color,
        category: newAppointment.category,
        reminder: newAppointment.reminder
      };

      const updatedAppointment = await db.updateAppointment(editingAppointment.id, updates);
      if (updatedAppointment) {
        setAppointments(prev => prev.map(apt => 
          apt.id === editingAppointment.id ? updatedAppointment : apt
        ));
        resetForm();
        setEditingAppointment(null);
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    setLoading(true);
    try {
      const success = await db.deleteAppointment(id);
      if (success) {
        setAppointments(prev => prev.filter(apt => apt.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (appointment: Appointment) => {
    setNewAppointment({
      title: appointment.title,
      description: appointment.description || '',
      time: appointment.time || '',
      color: appointment.color || '#ff7b00',
      category: appointment.category || 'personal',
      reminder: appointment.reminder || false
    });
    setEditingAppointment(appointment);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setNewAppointment({
      title: '',
      description: '',
      time: '',
      color: '#ff7b00',
      category: 'personal',
      reminder: false
    });
  };

  // The form opens below the grid; bring it into view so it doesn't look like nothing happened.
  const formRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showAddForm && !editingAppointment) return;
    const el = formRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  }, [showAddForm, editingAppointment]);

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
    return (
      <div className={styles.appointmentForm} ref={formRef}>
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
                aria-label="Previous month"
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
                aria-label="Next month"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button onClick={onClose} className={styles.closeButton}
              aria-label="Close calendar">
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
          {selectedDate && (
            <div className={styles.selectedDateActions}>
              <div className={styles.selectedDateInfo}>
                <span>Selected: {parseLocalDate(selectedDate).toLocaleDateString()}</span>
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
          <>
              <div className={styles.appointmentsPanelHeader}>
                <h4>
                  {selectedDate 
                    ? `${parseLocalDate(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Appointments` 
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
                    {appointments.filter(apt => apt.date > localDate(today)).length}
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
                            {appointment.category === 'study' && '📚'}
                            {appointment.category === 'other' && '📌'}
                            {appointment.category || 'personal'}
                          </div>
                          {appointment.reminder && (
                            <div className={styles.reminderBadge} title="Reminder enabled">
                              🔔
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
                          onClick={() => handleDeleteAppointment(appointment.id)}
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
        </div>
      </div>
    </div>
  );
};

export default Calendar;
