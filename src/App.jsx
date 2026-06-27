import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Pill, 
  HeartPulse, 
  ShieldCheck, 
  User, 
  Settings,
  AlertCircle,
  Package,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Activity,
  Droplet,
  Bell,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';

// --- Utility Functions ---
const getLocalDateString = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const diffInDays = (startStr, endStr) => {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const utc1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

// --- Standalone React Components (Defined outside App scope to fix input focus bugs) ---

function NotificationToast({ show, onClose, title, desc }) {
  if (!show) return null;
  return (
    <div className="notification-toast">
      <div className="toast-badge">
        <Bell size={24} className="animated-bell" />
      </div>
      <div className="toast-body">
        <h3 className="toast-title">{title}</h3>
        <p className="toast-desc">{desc}</p>
      </div>
      <button onClick={onClose} className="toast-close">
        <X size={20} />
      </button>
    </div>
  );
}

function SettingsModal({ show, onClose, drugName, setDrugName, dosage, setDosage }) {
  if (!show) return null;

  const handleInputFocus = (e) => {
    // Wait for the virtual keyboard to fully pop up and resize the viewport
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">הגדרת תרופה ומינון</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>
        <div className="form-fields">
          <div>
            <label className="input-label">שם התרופה (הקלידי בעצמך)</label>
            <input 
              type="text" 
              placeholder="לדוגמה: גלולות למניעת הריון..."
              value={drugName} 
              onChange={(e) => setDrugName(e.target.value)}
              onFocus={handleInputFocus}
              className="form-input"
            />
          </div>
          <div>
            <label className="input-label">מינון יומי</label>
            <input 
              type="text" 
              placeholder="לדוגמה: כדור אחד ביום"
              value={dosage} 
              onChange={(e) => setDosage(e.target.value)}
              onFocus={handleInputFocus}
              className="form-input"
            />
          </div>
          <button onClick={onClose} className="submit-btn">
            שמירת שינויים
          </button>
        </div>
      </div>
    </div>
  );
}

function DayActionModal({ show, onClose, dateStr, onMarkCycleStart, onMarkTreatmentStart, onToggleTaken, isCycleStart, isTreatmentStart, isTaken }) {
  if (!show) return null;
  
  // Format Hebrew date display
  const formattedDate = dateStr ? dateStr.split('-').reverse().join('/') : '';
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">אפשרויות לתאריך {formattedDate}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>
        <div className="form-fields" style={{ gap: '0.85rem' }}>
          <button 
            onClick={() => { onMarkCycleStart(dateStr); onClose(); }} 
            className="refill-btn standard"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', justifyContent: 'center' }}
          >
            <Droplet size={18} className="warn-icon" style={{ color: '#f43f5e', margin: 0 }} />
            <span>{isCycleStart ? 'בטלי סימון תחילת מחזור (Bleeding)' : 'קבעי כתחילת המחזור (Bleeding)'}</span>
          </button>
          
          <button 
            onClick={() => { onMarkTreatmentStart(dateStr); onClose(); }} 
            className="refill-btn standard"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', justifyContent: 'center' }}
          >
            <Pill size={18} style={{ color: '#7c3aed' }} />
            <span>{isTreatmentStart ? 'בטלי סימון תחילת טיפול' : 'קבעי כתחילת הטיפול'}</span>
          </button>

          <button 
            onClick={() => { onToggleTaken(dateStr); onClose(); }} 
            className="refill-btn standard"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', justifyContent: 'center' }}
          >
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <span>{isTaken ? 'בטלי דיווח נטילת תרופה' : 'דווחי על נטילת תרופה'}</span>
          </button>

          <button 
            onClick={onClose} 
            className="submit-btn" 
            style={{ background: '#64748b', marginTop: '0.75rem', padding: '0.75rem' }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

function TreatmentAlertModal({ show, onClose, onStartTreatment }) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ border: '2px solid #a78bfa', animation: 'zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={24} className="animated-bell" />
            <span>תזכורת: זמן להתחיל טיפול!</span>
          </h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>
        <div style={{ padding: '0.25rem 0 1rem 0', textAlign: 'right' }}>
          <p style={{ fontSize: '0.95rem', color: '#4c1d95', lineHeight: '1.5', fontWeight: '500' }}>
            עברו 14 ימים מתחילת המחזור שסימנת. על פי התוכנית הטיפולית, היום (היום ה-15) עליך להתחיל את נטילת התרופות.
          </p>
        </div>
        <div className="form-fields">
          <button 
            onClick={() => { onStartTreatment(); onClose(); }} 
            className="submit-btn"
            style={{ margin: 0 }}
          >
            התחלתי את הטיפול היום
          </button>
          <button 
            onClick={onClose} 
            className="refill-btn standard"
            style={{ padding: '0.75rem', fontWeight: '700' }}
          >
            סגור תזכורת
          </button>
        </div>
      </div>
    </div>
  );
}

function ParentAlertNotification({ show, onClose, treatmentDay }) {
  if (!show) return null;
  return (
    <div className="notification-toast" style={{ border: '1px solid #fca5a5', background: 'rgba(254, 242, 242, 0.95)', boxShadow: '0 20px 40px rgba(239, 68, 68, 0.15)' }}>
      <div className="toast-badge" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 6px 12px rgba(239, 68, 68, 0.2)' }}>
        <AlertCircle size={24} className="animated-bell" />
      </div>
      <div className="toast-body">
        <h3 className="toast-title" style={{ color: '#991b1b' }}>התראת אי-דיווח תרופה</h3>
        <p className="toast-desc" style={{ color: '#7f1d1d' }}>
          הנערה נמצאת ביום ה-{treatmentDay + 1} של הטיפול התרופתי, אך טרם סימנה שנלקחה התרופה היומית להיום.
        </p>
      </div>
      <button onClick={onClose} className="toast-close" style={{ color: '#f87171' }}>
        <X size={20} />
      </button>
    </div>
  );
}

function ConfirmUndoModal({ show, onClose, onConfirm, message }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 120 }}>
      <div className="modal-content" style={{ maxWidth: '340px', border: '1px solid #fca5a5' }}>
        <div style={{ padding: '0.5rem 0 1.25rem 0', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', color: '#1e1b4b', fontWeight: '700', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="submit-btn" 
            style={{ margin: 0, flex: 1, background: '#ef4444' }}
          >
            אישור
          </button>
          <button 
            onClick={onClose} 
            className="refill-btn standard" 
            style={{ margin: 0, flex: 1, padding: '0.75rem', fontWeight: '700' }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

function Calendar({ currentMonth, setCurrentMonth, todayStr, cycleStartDate, treatmentStartDate, markedTakenDays, justMarkedDate, onDayClick, role }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

  return (
    <div className="glass-card calendar-card">
      <div className="calendar-header">
        <h2 className="calendar-title">
          {monthNames[month]} {year}
        </h2>
        <div className="calendar-nav">
          <button onClick={prevMonth} className="nav-btn">
            <ChevronRight size={18}/>
          </button>
          <button onClick={nextMonth} className="nav-btn">
            <ChevronLeft size={18}/>
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
          <div key={day} className="weekday-header">{day}</div>
        ))}
        
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          
          const dateStr = getLocalDateString(date);
          const isToday = dateStr === todayStr;
          
          const isCycleStart = dateStr === cycleStartDate;
          const isTreatmentStart = dateStr === treatmentStartDate;
          const isTaken = markedTakenDays[dateStr] === true;
          const isJustMarked = dateStr === justMarkedDate;
          
          const isClickable = role === 'teen';

          let extraClasses = "";
          if (isCycleStart) extraClasses += " is-cycle-start";
          if (isTreatmentStart) extraClasses += " is-treatment-start";
          
          // Apply spin-morph animation class if just checked, else apply static taken class
          if (isTaken) {
            if (isJustMarked) {
              extraClasses += " animate-spin-morph";
            } else {
              extraClasses += " is-taken-day";
            }
          }

          if (isToday) extraClasses += " is-today";
          if (isClickable) extraClasses += " is-clickable";

          return (
            <div key={dateStr} className="date-btn-container">
              <button
                disabled={!isClickable}
                onClick={() => onDayClick(dateStr)}
                className={`date-btn${extraClasses}`}
              >
                {date.getDate()}
                
                {/* Visual marker dots only for bleeding and treatment start */}
                {!isTaken && isCycleStart && <span className="marker-dot cycle-start" />}
                {!isTaken && isTreatmentStart && <span className="marker-dot treatment-start" />}
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot cycle-start"></div>
          <span>דימום (Start of Cycle)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot treatment-start"></div>
          <span>תחילת טיפול (Treatment Start)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot taken"></div>
          <span>תרופה נלקחה (Medication Taken)</span>
        </div>
      </div>
    </div>
  );
}

function TeenView({ 
  cycleStartDate, 
  treatmentStartDate, 
  markedTakenDays, 
  justMarkedDate,
  todayStr, 
  drugName, 
  dosage, 
  showRefillAlert, 
  daysUntilRefill, 
  handleLogRefill, 
  onDayClick, 
  currentMonth, 
  setCurrentMonth, 
  role, 
  setShowSettings,
  onToggleTaken
}) {
  const cycleDay = cycleStartDate ? diffInDays(cycleStartDate, todayStr) : null;
  const treatmentDay = treatmentStartDate ? diffInDays(treatmentStartDate, todayStr) : null;
  
  const isMedicationTakenToday = markedTakenDays[todayStr] === true;

  const isInTreatmentWindow = treatmentDay !== null && treatmentDay >= 0 && treatmentDay <= 9;
  const isInWaitingWindow = !isInTreatmentWindow && cycleDay !== null && cycleDay >= 0 && cycleDay <= 13;

  return (
    <div className="view-container">

      {/* Main Status Card */}
      <div className="glass-card status-card">
        {isInTreatmentWindow ? (
          <>
            <div className="status-icon-wrapper medication">
              <Pill size={32} strokeWidth={1.5} />
            </div>
            <h2 className="status-title">שלב התרופה</h2>
            <p className="status-subtitle">
              יום {treatmentDay + 1} מתוך 10 לטיפול
            </p>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${((treatmentDay + 1) / 10) * 100}%` }}></div>
            </div>
            
            <div className="inline-med-control">
               {(!drugName || !dosage) ? (
                 <button onClick={() => setShowSettings(true)} className="setup-prompt-btn">
                   <Edit3 size={24} />
                   <span>הקלידי את פרטי התרופה כאן</span>
                 </button>
               ) : (
                 <>
                   <div className="med-details-group" onClick={() => setShowSettings(true)} title="עריכת תרופה">
                      <div className="med-details-header">
                        <p className="med-name">{drugName}</p>
                        <Edit3 size={12} className="med-edit-icon" />
                      </div>
                      <p className="med-dosage">{dosage}</p>
                   </div>
                   {isMedicationTakenToday ? (
                     <button onClick={() => onToggleTaken(todayStr)} className="med-status-tag">
                       <CheckCircle2 size={16} /> 
                       <span>נלקח היום</span>
                     </button>
                   ) : (
                     <button onClick={() => onToggleTaken(todayStr)} className="mark-taken-btn">
                       סמני כנלקח
                     </button>
                   )}
                 </>
               )}
            </div>
          </>
        ) : isInWaitingWindow ? (
          <>
            <div className="status-icon-wrapper waiting">
              <CalendarIcon size={32} strokeWidth={1.5} />
            </div>
            <h2 className="status-title">שלב ההמתנה</h2>
            <p className="status-subtitle">
              יום {cycleDay + 1} מתוך 14 למחזור
            </p>
            <div className="progress-bar-container" style={{ background: 'rgba(219, 39, 119, 0.1)' }}>
              <div className="progress-bar" style={{ width: `${((cycleDay + 1) / 14) * 100}%`, background: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)' }}></div>
            </div>
            <p className="status-helper-text">הטיפול התרופתי יתחיל ביום ה-15</p>
          </>
        ) : (
          <>
            <div className="status-icon-wrapper inactive">
              <HeartPulse size={32} />
            </div>
            <h2 className="status-title">אין טיפול/מחזור פעיל</h2>
            <p className="status-helper-text inactive">
              לחצי על יום בלוח השנה וסמני את תאריך תחילת המחזור או תחילת הטיפול כדי להתחיל מעקב.
            </p>
          </>
        )}
      </div>

      <Calendar 
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        todayStr={todayStr}
        cycleStartDate={cycleStartDate}
        treatmentStartDate={treatmentStartDate}
        markedTakenDays={markedTakenDays}
        justMarkedDate={justMarkedDate}
        onDayClick={onDayClick}
        role={role}
      />

      {/* Action Buttons & Refill Alert */}
      <div className="actions-grid">
        <button onClick={() => onDayClick(todayStr)} className="action-card">
          <div className="action-info">
            <div className="action-icon">
              <Droplet size={24} />
            </div>
            <div className="action-text">
              <h3>דיווח תאריכים יומי</h3>
              <p>לחצי כאן לעדכון יום נוכחי</p>
            </div>
          </div>
          <ChevronLeft className="chevron-icon" />
        </button>

        <div className={`refill-card${showRefillAlert ? ' has-alert' : ''}`}>
          <div className="refill-header">
            <div className="refill-meta">
              <div className="refill-icon">
                <Package size={20} />
              </div>
              <div className="refill-label">
                <h3>מלאי תרופות</h3>
                <p>
                  {daysUntilRefill !== null ? `נותרו ${daysUntilRefill} ימים` : 'לא הוגדר'}
                </p>
              </div>
            </div>
            {showRefillAlert && <AlertCircle className="refill-alert-icon" size={24} />}
          </div>
          <button 
            onClick={handleLogRefill}
            className={`refill-btn ${showRefillAlert ? 'alert' : 'standard'}`}
          >
            חדשתי מרשם (120 ימים)
          </button>
        </div>
      </div>
    </div>
  );
}

function ParentView({ 
  cycleStartDate, 
  treatmentStartDate, 
  markedTakenDays, 
  todayStr, 
  drugName, 
  daysUntilRefill, 
  showRefillAlert 
}) {
  const cycleDay = cycleStartDate ? diffInDays(cycleStartDate, todayStr) : null;
  const treatmentDay = treatmentStartDate ? diffInDays(treatmentStartDate, todayStr) : null;
  
  const isMedicationTakenToday = markedTakenDays[todayStr] === true;
  
  const isInTreatmentWindow = treatmentDay !== null && treatmentDay >= 0 && treatmentDay <= 9;
  const isInWaitingWindow = !isInTreatmentWindow && cycleDay !== null && cycleDay >= 0 && cycleDay <= 13;

  return (
    <div className="view-container">
      <div className="glass-card parent-header-card">
        <div className="parent-avatar-badge">
          <ShieldCheck size={32} />
        </div>
        <h2 className="parent-title">מעקב הורים</h2>
        <p className="parent-desc">
          צפייה בלבד. המידע מתעדכן על ידי הנערה לשמירה על פרטיותה ועצמאותה.
        </p>
      </div>

      <div className="glass-card parent-status-card">
        <div className="parent-section-title">
          <Activity size={20} className="parent-section-icon" />
          <h3>סטטוס נוכחי</h3>
        </div>
        
        <div className="info-rows">
          <div className="info-row">
            <span className="label">שלב במחזור:</span>
            <span className="value" style={{ color: isInTreatmentWindow ? '#7c3aed' : isInWaitingWindow ? '#db2777' : '#64748b' }}>
              {isInTreatmentWindow ? 'נטילת תרופה' : isInWaitingWindow ? 'המתנה (14 ימים)' : 'לא פעיל'}
            </span>
          </div>
          {cycleDay !== null && cycleDay <= 23 && (
            <div className="info-row">
              <span className="label">יום נוכחי למחזור:</span>
              <span className="value">יום {cycleDay + 1} מתוך 24</span>
            </div>
          )}
          {isInTreatmentWindow && (
            <>
              <div className="info-row">
                <span className="label">יום טיפול תרופתי:</span>
                <span className="value">יום {treatmentDay + 1} מתוך 10</span>
              </div>
              <div className="info-row">
                <span className="label">שם התרופה:</span>
                <span className="value">{drugName || 'טרם הוזן'}</span>
              </div>
              <div className="info-row">
                <span className="label">סטטוס תרופה היום:</span>
                <span className="value" style={{ color: isMedicationTakenToday ? '#10b981' : '#ef4444' }}>
                  {isMedicationTakenToday ? 'נלקח בהצלחה' : 'טרם נלקח'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Missing Logs Warning for Parent */}
      {isInTreatmentWindow && !isMedicationTakenToday && (
        <div className="parent-warn-banner" style={{ border: '1px solid #fca5a5', background: '#fef2f2' }}>
          <AlertCircle className="warn-icon" size={20} style={{ color: '#ef4444' }} />
          <div className="warn-content">
            <h4 style={{ color: '#991b1b' }}>תזכורת תרופה להורה</h4>
            <p style={{ color: '#7f1d1d' }}>
              הנערה נמצאת בשלב נטילת התרופה אך טרם סימנה שנלקחה היום. כדאי לבדוק או להזכיר בעדינות.
            </p>
          </div>
        </div>
      )}

      {/* Refill Status for Parent */}
      <div className="glass-card parent-status-card">
        <div className="parent-section-title">
           <Package size={20} className="parent-section-icon" />
           <h3>סטטוס מרשמים</h3>
        </div>
        
        <div className="info-rows">
          <div className="info-row">
            <span className="label">ימים שנותרו לחידוש:</span>
            <span className="value" style={{ color: showRefillAlert ? '#ef4444' : '#1e1b4b' }}>
              {daysUntilRefill !== null ? `${daysUntilRefill} ימים` : 'לא ידוע'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [role, setRole] = useState('teen'); // 'teen' | 'parent'
  const [showSettings, setShowSettings] = useState(false);
  
  // Medication details - prefilled for user convenience
  const [drugName, setDrugName] = useState('גלולות Care');
  const [dosage, setDosage] = useState('כדור אחד בערב');

  const today = new Date();
  const todayStr = getLocalDateString(today);

  // Initialize demo: Cycle start 14 days ago (makes today the target Day 15 Alert!)
  const demoCycleStart = new Date();
  demoCycleStart.setDate(today.getDate() - 14);
  const [cycleStartDate, setCycleStartDate] = useState(getLocalDateString(demoCycleStart));

  // Manually configured Treatment Start Date (set to null initially for demo/manual choice)
  const [treatmentStartDate, setTreatmentStartDate] = useState(null);

  // Medication logs: key is dateStr, value is boolean
  const [markedTakenDays, setMarkedTakenDays] = useState({});
  
  // Date which was just marked as taken, triggers local spin animation
  const [justMarkedDate, setJustMarkedDate] = useState(null);

  // Refill details
  const demoRefillStart = new Date();
  demoRefillStart.setDate(today.getDate() - 115); // 5 days left until 120 days
  const [refillDate, setRefillDate] = useState(getLocalDateString(demoRefillStart));

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateForAction, setSelectedDateForAction] = useState(null);

  // Alerts dismissal states
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [parentAlertDismissed, setParentAlertDismissed] = useState(false);

  // Undo Confirmation dialog state
  const [confirmUndo, setConfirmUndo] = useState(null);

  // Reset parent notification when role toggles to parent, so it shows immediately again if unresolved
  useEffect(() => {
    if (role === 'parent') {
      setParentAlertDismissed(false);
    }
  }, [role]);

  // Derived state
  const cycleDay = cycleStartDate ? diffInDays(cycleStartDate, todayStr) : null;
  const treatmentDay = treatmentStartDate ? diffInDays(treatmentStartDate, todayStr) : null;

  // Refill math
  const daysSinceRefill = refillDate ? diffInDays(refillDate, todayStr) : null;
  const daysUntilRefill = daysSinceRefill !== null ? Math.max(0, 120 - daysSinceRefill) : null;
  const showRefillAlert = daysUntilRefill !== null && daysUntilRefill <= 7;

  // Automated Day 15 Alert logic
  // Cycle starts at Day 1 (cycleDay = 0). Day 15 is cycleDay = 14.
  const isTargetAlertDay = cycleDay === 14;
  const shouldShowAlertModal = isTargetAlertDay && role === 'teen' && !alertDismissed;

  // Parental notifications trigger logic:
  // Teen is in 10-day medication treatment window, but hasn't taken it today
  const isTreatmentWindowActive = treatmentDay !== null && treatmentDay >= 0 && treatmentDay <= 9;
  const hasMissedTodayPill = isTreatmentWindowActive && !markedTakenDays[todayStr];
  const shouldShowParentNotification = role === 'parent' && hasMissedTodayPill && !parentAlertDismissed;

  // Handlers with undo guards
  const handleMarkCycleStart = (dateStr) => {
    const isCycleStart = cycleStartDate === dateStr;
    if (isCycleStart) {
      // Prompt undo confirmation
      setConfirmUndo({
        message: 'האם את בטוחה שברצונך לבטל את סימון תחילת המחזור?',
        onConfirm: () => {
          setCycleStartDate(null);
          setAlertDismissed(false);
        }
      });
    } else {
      setCycleStartDate(dateStr);
      setAlertDismissed(false); // Reset alert state if a new cycle is set
    }
  };

  const handleMarkTreatmentStart = (dateStr) => {
    const isTreatmentStart = treatmentStartDate === dateStr;
    if (isTreatmentStart) {
      // Prompt undo confirmation
      setConfirmUndo({
        message: 'האם את בטוחה שברצונך לבטל את סימון תחילת הטיפול?',
        onConfirm: () => {
          setTreatmentStartDate(null);
        }
      });
    } else {
      setTreatmentStartDate(dateStr);
    }
  };

  const handleToggleTaken = (dateStr) => {
    const isTaken = markedTakenDays[dateStr] === true;
    if (isTaken) {
      // Prompt undo confirmation
      setConfirmUndo({
        message: 'האם את בטוחה שברצונך לבטל את הפעולה?',
        onConfirm: () => {
          setMarkedTakenDays(prev => ({
            ...prev,
            [dateStr]: false
          }));
        }
      });
    } else {
      // Mark as Taken
      setMarkedTakenDays(prev => ({
        ...prev,
        [dateStr]: true
      }));

      // Trigger 360 spin animation feedback
      setJustMarkedDate(dateStr);
      setTimeout(() => {
        setJustMarkedDate(null);
      }, 700);

      // CONFETTI explosion milestone for Day 10 (treatmentDay index 9)
      const tDay = treatmentStartDate ? diffInDays(treatmentStartDate, dateStr) : null;
      if (tDay === 9) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handleLogRefill = () => {
    const isRefillToday = refillDate === todayStr;
    if (isRefillToday) {
      setConfirmUndo({
        message: 'האם את בטוחה שברצונך לבטל את סימון חידוש המרשם?',
        onConfirm: () => {
          setRefillDate(null);
        }
      });
    } else {
      setRefillDate(todayStr);
    }
  };

  return (
    <div className="app-container" dir="rtl">
      
      {/* 1. Automated Day 15 Treatment Alert Modal */}
      <TreatmentAlertModal 
        show={shouldShowAlertModal}
        onClose={() => setAlertDismissed(true)}
        onStartTreatment={() => {
          setTreatmentStartDate(todayStr);
          setAlertDismissed(true);
        }}
      />

      {/* 2. Parent Real-time Missed Medication Push Notification */}
      <ParentAlertNotification 
        show={shouldShowParentNotification}
        onClose={() => setParentAlertDismissed(true)}
        treatmentDay={treatmentDay}
      />

      {/* 3. Undo Action Confirmation Dialog Modal */}
      <ConfirmUndoModal 
        show={confirmUndo !== null}
        onClose={() => setConfirmUndo(null)}
        onConfirm={confirmUndo ? confirmUndo.onConfirm : () => {}}
        message={confirmUndo ? confirmUndo.message : ''}
      />

      {/* Header Section */}
      <header className="app-header">
        <div className="brand-info">
          <h1 className="brand-name">Care cycle</h1>
          <p className="brand-tagline">מעקב אישי חכם</p>
        </div>
        
        <div className="header-controls">
          {role === 'teen' && (
            <button 
              onClick={() => setShowSettings(true)}
              className="icon-btn"
              title="הגדרות"
            >
              <Settings size={20} />
            </button>
          )}
          <button 
            onClick={() => setRole(role === 'teen' ? 'parent' : 'teen')}
            className={`role-badge ${role === 'teen' ? 'is-teen' : 'is-parent'}`}
          >
            <User size={16} />
            <span>{role === 'teen' ? 'נערה' : 'הורה'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {role === 'teen' ? (
          <TeenView 
            cycleStartDate={cycleStartDate}
            treatmentStartDate={treatmentStartDate}
            markedTakenDays={markedTakenDays}
            justMarkedDate={justMarkedDate}
            todayStr={todayStr}
            drugName={drugName}
            dosage={dosage}
            showRefillAlert={showRefillAlert}
            daysUntilRefill={daysUntilRefill}
            handleLogRefill={handleLogRefill}
            onDayClick={(dateStr) => setSelectedDateForAction(dateStr)}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            role={role}
            setShowSettings={setShowSettings}
            onToggleTaken={handleToggleTaken}
          />
        ) : (
          <ParentView 
            cycleStartDate={cycleStartDate}
            treatmentStartDate={treatmentStartDate}
            markedTakenDays={markedTakenDays}
            todayStr={todayStr}
            drugName={drugName}
            daysUntilRefill={daysUntilRefill}
            showRefillAlert={showRefillAlert}
          />
        )}
      </main>
      
      {/* 4. Settings Modal (Prefilled setup) */}
      <SettingsModal 
        show={showSettings}
        onClose={() => setShowSettings(false)}
        drugName={drugName}
        setDrugName={setDrugName}
        dosage={dosage}
        setDosage={setDosage}
      />

      {/* 5. Action-Based Calendar Day Click Options Modal */}
      <DayActionModal 
        show={selectedDateForAction !== null}
        onClose={() => setSelectedDateForAction(null)}
        dateStr={selectedDateForAction}
        onMarkCycleStart={handleMarkCycleStart}
        onMarkTreatmentStart={handleMarkTreatmentStart}
        onToggleTaken={handleToggleTaken}
        isCycleStart={selectedDateForAction === cycleStartDate}
        isTreatmentStart={selectedDateForAction === treatmentStartDate}
        isTaken={markedTakenDays[selectedDateForAction] === true}
      />

    </div>
  );
}
