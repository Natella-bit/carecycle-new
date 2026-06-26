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
import './App.css';

// Utility functions for date manipulation
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

export default function App() {
  // Application State
  const [role, setRole] = useState('teen'); // 'teen' | 'parent'
  const [showSettings, setShowSettings] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  // Starting with empty medication details so the teen must enter them
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');

  // Initialize dates for demo purposes
  const today = new Date();
  
  // Set demo to EXACTLY day 14 to show the push notification right away
  const demoPeriodStart = new Date();
  demoPeriodStart.setDate(today.getDate() - 14); 
  
  const demoRefillStart = new Date();
  demoRefillStart.setDate(today.getDate() - 115); // 5 days left until 120 days

  const [periodStartDate, setPeriodStartDate] = useState(getLocalDateString(demoPeriodStart));
  const [refillDate, setRefillDate] = useState(getLocalDateString(demoRefillStart));
  const [medLogs, setMedLogs] = useState({});
  
  // Create demo period logs for the first 4 days to show the unique marking
  const demoPeriodLogs = {};
  for(let i=0; i<4; i++) {
    const d = new Date(demoPeriodStart);
    d.setDate(d.getDate() + i);
    demoPeriodLogs[getLocalDateString(d)] = true;
  }
  const [periodLogs, setPeriodLogs] = useState(demoPeriodLogs);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Derived State
  const todayStr = getLocalDateString(today);
  const cycleDay = periodStartDate ? diffInDays(periodStartDate, todayStr) : null;
  
  // Cycle logic: Days 0-13 Waiting (14 days total), Days 14-23 Medication
  const isWaitingPhase = cycleDay !== null && cycleDay >= 0 && cycleDay <= 13;
  const isMedicationPhase = cycleDay !== null && cycleDay >= 14 && cycleDay <= 23;
  const isMedicationTakenToday = medLogs[todayStr] === true;

  // Refill logic: 120 days cycle
  const daysSinceRefill = refillDate ? diffInDays(refillDate, todayStr) : null;
  const daysUntilRefill = daysSinceRefill !== null ? Math.max(0, 120 - daysSinceRefill) : null;
  const showRefillAlert = daysUntilRefill !== null && daysUntilRefill <= 7;

  // Check for day 14 notification (Push Notification simulation)
  useEffect(() => {
    if (cycleDay === 14 && role === 'teen') {
      setShowNotification(true);
      
      // Optional: Try native browser notification if permitted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Care cycle - תזכורת טיפול", {
          body: "עברו 14 ימים מתחילת המחזור. זה הזמן להתחיל את הטיפול התרופתי.",
          icon: "/favicon.ico"
        });
      }
    } else {
      setShowNotification(false);
    }
  }, [cycleDay, role]);

  // Request notification permission on first load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Handlers
  const handleLogPeriod = () => {
    setPeriodStartDate(todayStr);
    setMedLogs({}); // Reset logs for the new cycle
    setPeriodLogs({ [todayStr]: true }); // Mark first day of bleeding
  };
  
  const handleLogRefill = () => setRefillDate(todayStr);
  
  const handleDayClick = (dateStr) => {
    if (role !== 'teen') return;
    
    const dayOfCycle = diffInDays(periodStartDate, dateStr);
    
    // Toggle medication log during med phase
    if (dayOfCycle >= 14 && dayOfCycle <= 23 && dateStr <= todayStr) {
      setMedLogs(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
    }
    // Toggle period bleeding log during waiting phase
    else if (dayOfCycle >= 0 && dayOfCycle <= 13 && dateStr <= todayStr) {
      setPeriodLogs(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
    }
  };

  // Components
  const NotificationToast = () => (
    <div className="notification-toast">
      <div className="toast-badge">
        <Bell size={24} className="animated-bell" />
      </div>
      <div className="toast-body">
        <h3 className="toast-title">הגיע הזמן להתחיל!</h3>
        <p className="toast-desc">
          עברו 14 ימים מיום קבלת המחזור. על פי התוכנית, עליך להתחיל את הטיפול התרופתי היום.
        </p>
      </div>
      <button 
        onClick={() => setShowNotification(false)} 
        className="toast-close"
      >
        <X size={20} />
      </button>
    </div>
  );

  const SettingsModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">הגדרת תרופה ומינון</h2>
          <button onClick={() => setShowSettings(false)} className="close-btn">
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
              className="form-input"
            />
          </div>
          <button 
            onClick={() => setShowSettings(false)}
            className="submit-btn"
          >
            שמירת שינויים
          </button>
        </div>
      </div>
    </div>
  );

  const Calendar = () => {
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
            const cycleD = periodStartDate ? diffInDays(periodStartDate, dateStr) : null;
            
            const isWait = cycleD !== null && cycleD >= 0 && cycleD <= 13;
            const isMed = cycleD !== null && cycleD >= 14 && cycleD <= 23;
            const isTaken = medLogs[dateStr] === true;
            const isPeriodDay = periodLogs[dateStr] === true;
            
            const isMedClickable = role === 'teen' && isMed && dateStr <= todayStr;
            const isWaitClickable = role === 'teen' && isWait && dateStr <= todayStr;
            const isClickable = isMedClickable || isWaitClickable;

            let extraClasses = "";
            if (isWait) extraClasses += " is-waiting";
            if (isMed) extraClasses += " is-medication";
            if (isPeriodDay) extraClasses += " is-bleeding";
            if (isTaken) extraClasses += " is-taken";
            if (isToday) extraClasses += " is-today";
            if (isClickable) extraClasses += " is-clickable";

            return (
              <div key={dateStr} className="date-btn-container">
                <button
                  disabled={!isClickable}
                  onClick={() => handleDayClick(dateStr)}
                  className={`date-btn${extraClasses}`}
                >
                  {date.getDate()}
                </button>
                {isMed && !isTaken && dateStr < todayStr && (
                  <div className="missed-dot" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-dot waiting"></div>
            <span>המתנה (14 יום)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot bleeding"></div>
            <span>דימום</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot medication"></div>
            <span>תרופה</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot taken"></div>
            <span>נלקח</span>
          </div>
        </div>
      </div>
    );
  };

  const TeenView = () => (
    <div className="view-container">

      {/* Main Status Card */}
      <div className="glass-card status-card">
        {isWaitingPhase ? (
          <>
            <div className="status-icon-wrapper waiting">
              <CalendarIcon size={32} strokeWidth={1.5} />
            </div>
            <h2 className="status-title">שלב ההמתנה</h2>
            <p className="status-subtitle">
              יום {cycleDay + 1} מתוך 14
            </p>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${((cycleDay + 1) / 14) * 100}%` }}></div>
            </div>
            <p className="status-helper-text">הטיפול התרופתי יתחיל ביום ה-15</p>
          </>
        ) : isMedicationPhase ? (
          <>
            <div className="status-icon-wrapper medication">
              <Pill size={32} strokeWidth={1.5} />
            </div>
            <h2 className="status-title">שלב התרופה</h2>
            <p className="status-subtitle">
              יום {cycleDay - 13} מתוך 10
            </p>
            
            <div className="inline-med-control">
               {(!drugName || !dosage) ? (
                 <button 
                   onClick={() => setShowSettings(true)}
                   className="setup-prompt-btn"
                 >
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
                     <div className="med-status-tag">
                       <CheckCircle2 size={16} /> 
                       <span>נלקח היום</span>
                     </div>
                   ) : (
                     <button 
                       onClick={() => handleDayClick(todayStr)}
                       className="mark-taken-btn"
                     >
                       סמני כנלקח
                     </button>
                   )}
                 </>
               )}
            </div>
          </>
        ) : (
          <>
            <div className="status-icon-wrapper inactive">
              <HeartPulse size={32} />
            </div>
            <h2 className="status-title">אין מחזור פעיל</h2>
            <p className="status-helper-text inactive">
              יש לדווח על היום הראשון של המחזור כדי להתחיל ספירה של 14 ימי המתנה.
            </p>
          </>
        )}
      </div>

      <Calendar />

      {/* Action Buttons & Refill Alert */}
      <div className="actions-grid">
        {/* Only show this button if not in a cycle or cycle is completely done */}
        {(!periodStartDate || cycleDay > 23) && (
          <button 
            onClick={handleLogPeriod}
            className="action-card"
          >
            <div className="action-info">
              <div className="action-icon">
                <Droplet size={24} />
              </div>
              <div className="action-text">
                <h3>קיבלתי מחזור</h3>
                <p>התחילי ספירת 14 ימים</p>
              </div>
            </div>
            <ChevronLeft className="chevron-icon" />
          </button>
        )}

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

  const ParentView = () => (
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
            <span className="value">
              {isWaitingPhase ? 'המתנה (14 ימים)' : isMedicationPhase ? 'נטילת תרופה' : 'לא פעיל'}
            </span>
          </div>
          {cycleDay !== null && cycleDay <= 23 && (
            <div className="info-row">
              <span className="label">יום נוכחי:</span>
              <span className="value">יום {cycleDay + 1} מתוך 24</span>
            </div>
          )}
          {isMedicationPhase && (
            <div className="info-row">
              <span className="label">שם התרופה:</span>
              <span className="value">{drugName || 'טרם הוזן'}</span>
            </div>
          )}
          {isMedicationPhase && (
            <div className="info-row">
              <span className="label">סטטוס תרופה היום:</span>
              <span className="value">
                {isMedicationTakenToday ? 'נלקח בהצלחה' : 'טרם נלקח'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Missing Logs Warning for Parent */}
      {isMedicationPhase && !isMedicationTakenToday && (
        <div className="parent-warn-banner">
          <AlertCircle className="warn-icon" size={20} />
          <div className="warn-content">
            <h4>תזכורת תרופה</h4>
            <p>
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
            <span className="value">{daysUntilRefill !== null ? daysUntilRefill : 'לא ידוע'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container" dir="rtl">
      
      {/* Push Notification Simulator */}
      {showNotification && <NotificationToast />}

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
        {role === 'teen' ? <TeenView /> : <ParentView />}
      </main>
      
      {/* Settings Modal */}
      {showSettings && <SettingsModal />}

    </div>
  );
}
