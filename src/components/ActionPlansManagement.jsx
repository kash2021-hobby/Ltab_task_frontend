import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Reusable Custom Multi-Select Dropdown Menu
const CustomMultiSelectDropdown = ({ options, selectedValues, onChange, placeholder, emptyMessage = 'No options available' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Dropdown Menu Trigger Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          minHeight: '38px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: isOpen ? '1.5px solid #2563eb' : '1.5px solid #dfe1e6',
          background: '#ffffff',
          fontSize: '0.875rem',
          color: selectedValues.length > 0 ? '#172b4d' : '#97a0af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          boxSizing: 'border-box'
        }}
      >
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '90%',
          fontWeight: selectedValues.length > 0 ? 500 : 400
        }}>
          {selectedValues.length > 0 ? selectedValues.join(', ') : placeholder}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#6b7280', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
          ▼
        </span>
      </div>

      {/* Dropdown Menu List Popover */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#ffffff',
          border: '1px solid #dfe1e6',
          borderRadius: '6px',
          boxShadow: '0 10px 25px -5px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31)',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1200,
          padding: '4px 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 10px 6px',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '4px',
            position: 'sticky',
            top: 0,
            background: '#ffffff',
            zIndex: 10
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
              {selectedValues.length} selected
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              style={{
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
          {options.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: '0.8125rem', color: '#97a0af', textAlign: 'center' }}>
              {emptyMessage}
            </div>
          ) : (
            options.map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const label = typeof opt === 'string' ? opt : opt.label;
              const subLabel = typeof opt === 'object' && opt.subLabel ? opt.subLabel : null;
              const isSelected = selectedValues.includes(val);

              return (
                <div
                  key={val}
                  onClick={() => toggleOption(val)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                    color: isSelected ? '#2563eb' : '#172b4d',
                    fontWeight: isSelected ? 600 : 400,
                    background: isSelected ? '#eff6ff' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f4f5f7'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>
                    {label}
                    {subLabel && <span style={{ fontSize: '0.75rem', color: isSelected ? '#2563eb' : '#97a0af', marginLeft: '6px' }}>({subLabel})</span>}
                  </span>
                  {isSelected && <span style={{ color: '#2563eb', fontWeight: 700 }}>✓</span>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Default initial template if creating fresh plan
const DEFAULT_180_DAY_TEMPLATE = [
  {
    id: 'pil_doc',
    title: 'Documentation',
    subheadings: [
      {
        id: 'sub_ca',
        title: 'HIRE CA FIRM TO REGISTER COMPANY',
        tasks: [
          { id: 'tsk_1', title: 'MOA, AOA, Shareholder Agreement', completed: false },
          { id: 'tsk_2', title: 'Trade licence, GST, MSME', completed: false },
          { id: 'tsk_3', title: 'Directors KYC, DIN, DSC, ODSC', completed: false }
        ]
      },
      {
        id: 'sub_bank',
        title: 'BANK A/C',
        tasks: [
          { id: 'tsk_4', title: 'Company details & Resolution', completed: false },
          { id: 'tsk_5', title: 'Directors KYC & Verification', completed: false },
          { id: 'tsk_6', title: 'Signage and office photos', completed: false }
        ]
      },
      {
        id: 'sub_tm',
        title: 'TRADEMARK',
        tasks: [
          { id: 'tsk_7', title: 'Drafting brand class details', completed: false },
          { id: 'tsk_8', title: 'Filing TM Application', completed: false },
          { id: 'tsk_9', title: 'Application number issuance', completed: false },
          { id: 'tsk_10', title: 'Formalities check pass', completed: false }
        ]
      },
      {
        id: 'sub_govt',
        title: 'STARTUP INDIA AND GOVT. SCHEMES',
        tasks: [
          { id: 'tsk_11', title: 'DPIIT Recognition Certificate', completed: false },
          { id: 'tsk_12', title: 'Tax exemption application', completed: false }
        ]
      }
    ]
  },
  {
    id: 'pil_ops',
    title: 'Operations',
    subheadings: [
      {
        id: 'sub_office_space',
        title: 'SETUP OFFICE — LOOK FOR SPACE',
        tasks: [
          { id: 'tsk_13', title: 'Minimum 4 parkings available', completed: false },
          { id: 'tsk_14', title: '800 to 1000 sq ft workspace', completed: false },
          { id: 'tsk_15', title: 'Preferably rooftop or glass facade', completed: false }
        ]
      },
      {
        id: 'sub_office_design',
        title: 'SETUP OFFICE — DESIGN AND SETUP',
        tasks: [
          { id: 'tsk_16', title: 'Gen-Z vibe & modern lighting', completed: true },
          { id: 'tsk_17', title: 'Fun and soulful breakout area', completed: true },
          { id: 'tsk_18', title: 'Cohesion and team seating layout', completed: true },
          { id: 'tsk_19', title: 'Productivity desks & ergonomic chairs', completed: false },
          { id: 'tsk_20', title: 'Utility & storage infrastructure', completed: false },
          { id: 'tsk_21', title: 'Cabins for executive meetings', completed: false },
          { id: 'tsk_22', title: 'Meeting and conference room AV setup', completed: false }
        ]
      },
      {
        id: 'sub_office_cafe',
        title: 'SETUP OFFICE — CAFE',
        tasks: [
          { id: 'tsk_23', title: 'Setup cafe (on actual site)', completed: false }
        ]
      }
    ]
  },
  {
    id: 'pil_mkt',
    title: 'Marketing',
    subheadings: [
      {
        id: 'sub_mkt_brand',
        title: 'BRAND IDENTITY & WEBSITE',
        tasks: [
          { id: 'tsk_24', title: 'Logo, color palette & typography', completed: false },
          { id: 'tsk_25', title: 'Website wireframe & design mockups', completed: false },
          { id: 'tsk_26', title: 'Domain acquisition & SSL deployment', completed: false }
        ]
      },
      {
        id: 'sub_mkt_social',
        title: 'SOCIAL MEDIA LAUNCH',
        tasks: [
          { id: 'tsk_27', title: 'Create LinkedIn, Instagram, X pages', completed: false },
          { id: 'tsk_28', title: 'Publish teaser campaign content', completed: false }
        ]
      }
    ]
  },
  {
    id: 'pil_rev',
    title: 'Revenue',
    subheadings: [
      {
        id: 'sub_rev_pricing',
        title: 'PRICING & SALES COLLATERAL',
        tasks: [
          { id: 'tsk_29', title: 'Finalize pricing tiers and packages', completed: false },
          { id: 'tsk_30', title: 'Sales pitch deck and brochure', completed: false }
        ]
      }
    ]
  },
  {
    id: 'pil_tech',
    title: 'Tech',
    subheadings: [
      {
        id: 'sub_tech_arch',
        title: 'ARCHITECTURE & DEPLOYMENT',
        tasks: [
          { id: 'tsk_31', title: 'Setup cloud infrastructure & SSL', completed: false },
          { id: 'tsk_32', title: 'Database migrations & CI/CD pipeline', completed: false }
        ]
      }
    ]
  }
];

export default function ActionPlansManagement({
  token,
  user,
  projects = [],
  actionPlansEnabled = true,
  onToggleFeature,
  onRefresh
}) {
  const [actionPlans, setActionPlans] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedPillars, setExpandedPillars] = useState({ pil_doc: false, pil_ops: true });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOpenSheetModal, setShowOpenSheetModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('180-Day Execution Plan');
  const [modalProjectName, setModalProjectName] = useState('My Startup Launch');
  const [modalStartDate, setModalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalDuration, setModalDuration] = useState(180);
  const [modalCheckpoint, setModalCheckpoint] = useState(60);
  const [modalStructure, setModalStructure] = useState([]);

  // Assign Task Modal States
  const [usersList, setUsersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTaskData, setAssigningTaskData] = useState(null);
  const [assignSelectedEmps, setAssignSelectedEmps] = useState([]); // multi-select employee array
  const [assignSelectedDepts, setAssignSelectedDepts] = useState([]); // multi-select dept array
  const [assignDept, setAssignDept] = useState('Operations');
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignStoryPoints, setAssignStoryPoints] = useState(3);

  // Fetch action plans, users, and departments on mount or project select
  useEffect(() => {
    fetchActionPlans();
    fetchUsersAndDepartments();
  }, [selectedProjectId]);

  const fetchUsersAndDepartments = async () => {
    try {
      const uRes = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (uRes.data.success) {
        // Normalize capitalized API keys to lowercase for consistent use
        const normalized = (uRes.data.data || []).map(u => ({
          id: u.UserID || u.user_id || u.id,
          full_name: u.FullName || u.full_name || u.name || u.email || '',
          email: u.Email || u.email || '',
          role: u.Role || u.role || 'TeamMember',
          department: u.Department || u.department || ''
        }));
        setUsersList(normalized);
      }
      const dRes = await axios.get('/api/departments', { headers: { Authorization: `Bearer ${token}` } });
      if (dRes.data.success) {
        // Normalize capitalized API keys to lowercase
        const normalized = (dRes.data.data || []).map(d => ({
          id: d.DepartmentID || d.id,
          name: d.Name || d.name || d.title || '',
          title: d.Name || d.name || d.title || ''
        }));
        setDepartmentsList(normalized);
      }
    } catch (err) {
      console.error('Error fetching users/departments for assignment:', err);
    }
  };

  const resolveAssigneeDisplayNames = (assignedToStr) => {
    if (!assignedToStr) return '';
    const items = String(assignedToStr).split(',').map(s => s.trim()).filter(Boolean);
    const resolved = items.map(item => {
      const found = usersList.find(u =>
        String(u.id) === String(item) ||
        String(u.full_name).toLowerCase() === item.toLowerCase() ||
        String(u.email).toLowerCase() === item.toLowerCase()
      );
      return found ? (found.full_name || found.email || item) : item;
    });
    return resolved.join(', ');
  };

  const openAssignModal = (pillarId, subheadingId, task) => {
    setAssigningTaskData({ pillarId, subheadingId, task });
    const rawEmps = task.assignedTo ? task.assignedTo.split(',').map(s => s.trim()).filter(Boolean) : [];
    const mappedEmps = rawEmps.map(emp => {
      const found = usersList.find(u =>
        String(u.id) === String(emp) ||
        String(u.full_name).toLowerCase() === emp.toLowerCase() ||
        String(u.email).toLowerCase() === emp.toLowerCase()
      );
      return found ? (found.full_name || emp) : emp;
    });
    setAssignSelectedEmps(mappedEmps);
    setAssignSelectedDepts(task.department ? task.department.split(',').map(s => s.trim()).filter(Boolean) : []);
    setAssignDept(task.department || '');
    setAssignStartDate(task.startDate || new Date().toISOString().split('T')[0]);
    setAssignDueDate(task.dueDate || '');
    setAssignStoryPoints(task.storyPoints || 3);
    setShowAssignModal(true);
    // Re-fetch so we always have latest users and departments
    fetchUsersAndDepartments();
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!activePlan || !assigningTaskData) return;
    if (assignSelectedEmps.length === 0) {
      alert('Please select at least one employee to assign this task.');
      return;
    }

    const resolvedAssignees = assignSelectedEmps.map(empName => {
      const found = usersList.find(u => (u.full_name || u.name) === empName || u.email === empName || String(u.id) === String(empName));
      return found ? (found.id || found.full_name || empName) : empName;
    });
    const assignedToJoined = resolvedAssignees.join(', ');

    try {
      const res = await axios.post(`/api/action-plans/${activePlan.plan_id}/assign-task`, {
        pillarId: assigningTaskData.pillarId,
        subheadingId: assigningTaskData.subheadingId,
        taskId: assigningTaskData.task.id,
        assignedTo: assignedToJoined,
        department: assignSelectedDepts.join(', ') || assignDept,
        startDate: assignStartDate,
        dueDate: assignDueDate,
        storyPoints: assignStoryPoints
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setShowAssignModal(false);
        setActivePlan(res.data.data);
        fetchActionPlans();
        if (onRefresh) onRefresh();
        alert(`✅ Task "${assigningTaskData.task.title}" assigned to ${assignedToJoined} and added to Task Board!`);
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      alert('Failed to assign task: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchActionPlans = async () => {
    setLoading(true);
    try {
      const url = selectedProjectId 
        ? `/api/action-plans?projectId=${selectedProjectId}` 
        : '/api/action-plans';
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActionPlans(res.data.data);
        if (res.data.data.length > 0) {
          setActivePlan(res.data.data[0]);
        } else {
          setActivePlan(null);
        }
      }
    } catch (err) {
      console.error('Error fetching action plans:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper calculations for Action Plan Stats
  const calculatePlanStats = (plan) => {
    if (!plan || !plan.structure) {
      return {
        totalItems: 0,
        doneItems: 0,
        overallPercent: 0,
        dayElapsed: 34,
        daysRemaining: 146,
        daysToCheckpoint: 26,
        pillarStats: []
      };
    }

    let structure = plan.structure;
    if (typeof structure === 'string') {
      try { structure = JSON.parse(structure); } catch (e) { structure = []; }
    }

    let totalItems = 0;
    let doneItems = 0;

    const pillarStats = (structure || []).map(pillar => {
      let pTotal = 0;
      let pDone = 0;
      (pillar.subheadings || []).forEach(sub => {
        (sub.tasks || []).forEach(task => {
          pTotal++;
          totalItems++;
          if (task.completed) {
            pDone++;
            doneItems++;
          }
        });
      });
      const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
      
      // Calculate elapsed timeline pace vs pillar percent
      const startDate = new Date(plan.start_date || new Date());
      const now = new Date();
      const diffTime = Math.max(0, now - startDate);
      const dayElapsed = Math.min(plan.duration_days || 180, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 || 34);
      const timePercent = Math.round((dayElapsed / (plan.duration_days || 180)) * 100);
      const isOnTrack = pPercent >= Math.max(5, timePercent - 10);

      return {
        id: pillar.id,
        title: pillar.title,
        doneCount: pDone,
        totalCount: pTotal,
        percent: pPercent,
        isOnTrack
      };
    });

    const overallPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    const startDate = new Date(plan.start_date || new Date());
    const now = new Date();
    const diffTime = Math.max(0, now - startDate);
    const duration = plan.duration_days || 180;
    const checkpoint = plan.checkpoint_days || 60;
    const dayElapsed = Math.min(duration, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 || 34);
    const daysRemaining = Math.max(0, duration - dayElapsed);
    const daysToCheckpoint = Math.max(0, checkpoint - (dayElapsed % checkpoint || checkpoint));

    return {
      totalItems,
      doneItems,
      overallPercent,
      dayElapsed,
      daysRemaining,
      daysToCheckpoint,
      duration,
      pillarStats
    };
  };

  const stats = calculatePlanStats(activePlan);

  // Toggle Pillar Expansion Accordion
  const togglePillar = (pillarId) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  // Toggle Checklist Task Completion
  const handleToggleTask = async (pillarId, subheadingId, taskId, currentCompleted) => {
    if (!activePlan) return;

    // Optimistic UI Update
    let currentStructure = activePlan.structure;
    if (typeof currentStructure === 'string') {
      try { currentStructure = JSON.parse(currentStructure); } catch (e) { currentStructure = []; }
    }

    const updatedStructure = currentStructure.map(pillar => {
      if (pillar.id === pillarId) {
        const updatedSubheadings = (pillar.subheadings || []).map(sub => {
          if (sub.id === subheadingId) {
            const updatedTasks = (sub.tasks || []).map(task => {
              if (task.id === taskId) {
                return { ...task, completed: !currentCompleted };
              }
              return task;
            });
            return { ...sub, tasks: updatedTasks };
          }
          return sub;
        });
        return { ...pillar, subheadings: updatedSubheadings };
      }
      return pillar;
    });

    setActivePlan({ ...activePlan, structure: updatedStructure });

    try {
      await axios.patch(`/api/action-plans/${activePlan.plan_id}/toggle-task`, {
        pillarId,
        subheadingId,
        taskId,
        completed: !currentCompleted
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error toggling task completion:', err);
      fetchActionPlans();
    }
  };

  // Add Task dynamically
  const handleAddTask = async (pillarId, subheadingId, taskTitle) => {
    if (!activePlan || !taskTitle || !taskTitle.trim()) return;

    let currentStructure = activePlan.structure;
    if (typeof currentStructure === 'string') {
      try { currentStructure = JSON.parse(currentStructure); } catch (e) { currentStructure = []; }
    }

    const newTask = {
      id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: taskTitle.trim(),
      completed: false
    };

    const updatedStructure = currentStructure.map(pillar => {
      if (pillar.id === pillarId) {
        const updatedSubheadings = (pillar.subheadings || []).map(sub => {
          if (sub.id === subheadingId) {
            return { ...sub, tasks: [...(sub.tasks || []), newTask] };
          }
          return sub;
        });
        return { ...pillar, subheadings: updatedSubheadings };
      }
      return pillar;
    });

    setActivePlan({ ...activePlan, structure: updatedStructure });

    try {
      await axios.put(`/api/action-plans/${activePlan.plan_id}`, {
        structure: updatedStructure
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error adding task:', err);
      fetchActionPlans();
    }
  };

  // Delete Task dynamically
  const handleDeleteTask = async (pillarId, subheadingId, taskId) => {
    if (!activePlan) return;

    let currentStructure = activePlan.structure;
    if (typeof currentStructure === 'string') {
      try { currentStructure = JSON.parse(currentStructure); } catch (e) { currentStructure = []; }
    }

    const updatedStructure = currentStructure.map(pillar => {
      if (pillar.id === pillarId) {
        const updatedSubheadings = (pillar.subheadings || []).map(sub => {
          if (sub.id === subheadingId) {
            const filteredTasks = (sub.tasks || []).filter(t => t.id !== taskId);
            return { ...sub, tasks: filteredTasks };
          }
          return sub;
        });
        return { ...pillar, subheadings: updatedSubheadings };
      }
      return pillar;
    });

    setActivePlan({ ...activePlan, structure: updatedStructure });

    try {
      await axios.put(`/api/action-plans/${activePlan.plan_id}`, {
        structure: updatedStructure
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      fetchActionPlans();
    }
  };

  // Add Subheading dynamically
  const handleAddSubheading = async (pillarId, subTitle) => {
    if (!activePlan || !subTitle || !subTitle.trim()) return;

    let currentStructure = activePlan.structure;
    if (typeof currentStructure === 'string') {
      try { currentStructure = JSON.parse(currentStructure); } catch (e) { currentStructure = []; }
    }

    const newSub = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: subTitle.trim().toUpperCase(),
      tasks: []
    };

    const updatedStructure = currentStructure.map(pillar => {
      if (pillar.id === pillarId) {
        return { ...pillar, subheadings: [...(pillar.subheadings || []), newSub] };
      }
      return pillar;
    });

    setActivePlan({ ...activePlan, structure: updatedStructure });

    try {
      await axios.put(`/api/action-plans/${activePlan.plan_id}`, {
        structure: updatedStructure
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error adding subheading:', err);
      fetchActionPlans();
    }
  };

  // Add Main Heading / Pillar dynamically
  const handleAddPillar = async (pillarTitle) => {
    if (!activePlan || !pillarTitle || !pillarTitle.trim()) return;

    let currentStructure = activePlan.structure;
    if (typeof currentStructure === 'string') {
      try { currentStructure = JSON.parse(currentStructure); } catch (e) { currentStructure = []; }
    }

    const newPillar = {
      id: 'pil_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: pillarTitle.trim(),
      subheadings: []
    };

    const updatedStructure = [...currentStructure, newPillar];

    setActivePlan({ ...activePlan, structure: updatedStructure });

    try {
      await axios.put(`/api/action-plans/${activePlan.plan_id}`, {
        structure: updatedStructure
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error adding main heading:', err);
      fetchActionPlans();
    }
  };

  // Create New Action Plan
  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault();
    const targetProjName = (modalProjectName || 'My Startup Launch').trim();

    try {
      const res = await axios.post('/api/action-plans', {
        projectId: targetProjName,
        title: modalTitle,
        startDate: modalStartDate,
        durationDays: Number(modalDuration),
        checkpointDays: Number(modalCheckpoint),
        structure: modalStructure
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setActivePlan(res.data.data);
        setIsEditMode(true);
        setIsDetailsExpanded(true);
        fetchActionPlans();
      }
    } catch (err) {
      console.error('Error creating action plan:', err);
      alert('Failed to create action plan: ' + (err.response?.data?.error || err.message));
    }
  };

  // Quick Seed Demo Action Plan if none exists
  const handleSeedDemoPlan = async () => {
    const targetProjName = selectedProjectId || 'My Startup Launch';
    try {
      const res = await axios.post('/api/action-plans', {
        projectId: targetProjName,
        title: '180-Day Execution Action Plan',
        startDate: new Date().toISOString().split('T')[0],
        durationDays: 180,
        checkpointDays: 60,
        structure: DEFAULT_180_DAY_TEMPLATE
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setActivePlan(res.data.data);
        fetchActionPlans();
      }
    } catch (err) {
      console.error('Error seeding demo plan:', err);
    }
  };

  // Delete Active Action Plan
  const handleDeletePlan = async () => {
    if (!activePlan) return;
    if (!window.confirm(`Are you sure you want to delete Action Plan "${activePlan.title}"? This action cannot be undone.`)) return;

    try {
      const res = await axios.delete(`/api/action-plans/${activePlan.plan_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setActivePlan(null);
        fetchActionPlans();
      }
    } catch (err) {
      console.error('Error deleting action plan:', err);
      alert('Failed to delete action plan: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: '6px',
        border: '1px solid #e4e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#172b4d' }}>Action Plans</h2>
            <span style={{ fontSize: '0.8125rem', color: '#97a0af', marginTop: '2px', display: 'block' }}>Track execution milestones and progress against timeline</span>
          </div>

          {/* Project Selector Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#97a0af', fontWeight: 600 }}>Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '0.8125rem', color: '#172b4d', background: '#ffffff', cursor: 'pointer', outline: 'none' }}
            >
              <option value="">All Projects</option>
              {Array.from(new Set(actionPlans.map(ap => ap.project_id).filter(Boolean))).map(projName => (
                <option key={projName} value={projName}>{projName}</option>
              ))}
              {projects.map(p => (
                <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Action Buttons */}
          <button
            className="btn"
            onClick={() => {
              setModalTitle('New Action Plan');
              setModalStructure([]);
              setShowCreateModal(true);
            }}
            style={{ fontSize: '0.8125rem', padding: '6px 14px', background: '#1e293b', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
          >
            + New Action Plan
          </button>
        </div>
      </div>

      {/* If No Action Plan Exists */}
      {!activePlan ? (
        <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', padding: '36px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#172b4d', margin: '0 0 6px' }}>No Action Plan Created Yet</h3>
          <p style={{ fontSize: '0.8125rem', color: '#97a0af', maxWidth: '400px', margin: '0 auto 20px', lineHeight: 1.5 }}>Create a structured action plan with pillars, subheadings and tasks to monitor progress over time.</p>
          <button onClick={() => { setModalTitle('New Action Plan'); setModalStructure([]); setShowCreateModal(true); }}
            style={{ padding: '7px 16px', background: '#1e293b', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            + Create Action Plan
          </button>
        </div>
      ) : (
        <>
          {/* ——— MAIN CARD CONTAINER (Reference UI Screenshot Match) ——— */}
          <div style={{ background: '#ffffff', border: '1px solid #e4e7eb', borderRadius: '6px', padding: '20px 24px', boxShadow: 'none' }}>

            {/* ——— Card Header ——— */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#172b4d', margin: 0 }}>
                  {activePlan.project_id || activePlan.Project?.title || 'Project Action Plan'}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#97a0af', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '1px 7px', borderRadius: '3px', fontSize: '0.6875rem', fontWeight: 700 }}>
                    {activePlan.title || '180 Days'}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#97a0af' }}>click a pillar to expand</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Edit / Save Toggle Button */}
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    style={{ background: '#00875a', border: 'none', borderRadius: '4px', padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Save Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsEditMode(true); setIsDetailsExpanded(true); }}
                    style={{ background: '#ffffff', border: '1px solid #dfe1e6', borderRadius: '4px', padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 600, color: '#172b4d', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    Edit Plan
                  </button>
                )}

                <button
                  onClick={() => setShowOpenSheetModal(true)}
                  style={{ background: '#ffffff', border: '1px solid #dfe1e6', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 500, color: '#5e6c84', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  Open Sheet
                </button>

                <button
                  type="button"
                  onClick={handleDeletePlan}
                  style={{ background: '#ffebe6', border: '1px solid #ffbdad', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 500, color: '#de350b', cursor: 'pointer' }}
                  title="Delete this Action Plan permanently"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Timeline Overview */}
            <div style={{ background: '#f8f9fa', border: '1px solid #e4e7eb', borderRadius: '6px', padding: '16px 20px', marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                {/* Left: Day Elapsed */}
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#172b4d', lineHeight: 1 }}>
                    Day {stats.dayElapsed} <span style={{ fontSize: '0.875rem', color: '#97a0af', fontWeight: 400 }}>of {stats.duration}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#97a0af', marginTop: '3px' }}>{stats.daysRemaining} days remaining</div>
                </div>

                {/* Center: Overall Completion */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#172b4d', lineHeight: 1 }}>{stats.overallPercent}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#97a0af', marginTop: '3px' }}>{stats.doneItems} of {stats.totalItems} done</div>
                </div>

                {/* Right: Checkpoint */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#172b4d', lineHeight: 1 }}>{stats.daysToCheckpoint}</div>
                  <div style={{ fontSize: '0.75rem', color: '#97a0af', marginTop: '3px' }}>days to day-60 checkpoint</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ height: '6px', width: '100%', background: '#e4e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.max(2, stats.overallPercent))}%`, background: '#2563eb', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.6875rem', color: '#97a0af' }}>
                  <span>Day 0</span><span>30</span><span>60</span><span>90</span><span>180</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              style={{
                width: '100%',
                padding: '8px 16px',
                background: isDetailsExpanded ? '#f4f5f7' : '#f4f5f7',
                border: '1px solid #dfe1e6',
                borderRadius: '4px',
                color: '#2563eb',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '0.7rem', transform: isDetailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
              <span>Click to Expand</span>
            </button>

            {/* ——— PILLARS / MAIN HEADINGS ACCORDION LIST ——— */}
            {isDetailsExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                {(activePlan.structure || []).map((pillar) => {
                  const isExpanded = expandedPillars[pillar.id] !== false;
                  const pillarStat = stats.pillarStats.find(s => s.id === pillar.id) || {
                    doneCount: 0,
                    totalCount: 0,
                    percent: 0,
                    isOnTrack: true
                  };

                  return (
                    <div key={pillar.id} style={{ border: '1px solid #e4e7eb', borderRadius: '6px', background: '#ffffff', overflow: 'hidden' }}>
                      {/* Pillar Header Row */}
                      <div
                        onClick={() => togglePillar(pillar.id)}
                        style={{ padding: '10px 16px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', borderBottom: isExpanded ? '1px solid #e4e7eb' : 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#97a0af', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', display: 'inline-block' }}>▶</span>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#172b4d', margin: 0 }}>{pillar.title}</h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#97a0af' }}>{pillarStat.doneCount}/{pillarStat.totalCount} · {pillarStat.percent}%</span>
                          <span style={{ padding: '2px 7px', borderRadius: '3px', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.4px', background: pillarStat.isOnTrack ? '#e3fcef' : '#ffebe6', color: pillarStat.isOnTrack ? '#00875a' : '#de350b' }}>
                            {pillarStat.isOnTrack ? 'ON TRACK' : 'BEHIND'}
                          </span>
                        </div>
                      </div>

                      {/* Pillar Expanded Content: Subheadings & Checklist Tasks */}
                      {isExpanded && (
                        <div style={{ padding: '20px 24px', background: '#ffffff' }}>
                          {(pillar.subheadings || []).map((subheading) => (
                            <div key={subheading.id} style={{ marginBottom: '20px' }}>
                              {/* Uppercase Muted Subheading Title */}
                              <div style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: '#94a3b8',
                                textTransform: 'uppercase',
                                letterSpacing: '0.8px',
                                marginBottom: '10px'
                              }}>
                                {subheading.title}
                              </div>

                              {/* Checklist Tasks Items */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(subheading.tasks || []).map((task) => (
                                  <div
                                    key={task.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '4px 0'
                                    }}
                                  >
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1, userSelect: 'none' }}>
                                      <input
                                        type="checkbox"
                                        checked={Boolean(task.completed)}
                                        onChange={() => handleToggleTask(pillar.id, subheading.id, task.id, Boolean(task.completed))}
                                        style={{
                                          width: '18px',
                                          height: '18px',
                                          accentColor: '#3b82f6',
                                          cursor: 'pointer'
                                        }}
                                      />
                                      <span style={{
                                        fontSize: '0.86rem',
                                        color: task.completed ? '#94a3b8' : '#1e293b',
                                        textDecoration: task.completed ? 'line-through' : 'none',
                                        fontWeight: task.completed ? 400 : 500
                                      }}>
                                        {task.title}
                                      </span>
                                    </label>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {task.assignedTo ? (
                                        <span
                                          onClick={() => openAssignModal(pillar.id, subheading.id, task)}
                                          style={{
                                            background: '#eff6ff',
                                            color: '#2563eb',
                                            border: '1px solid #bfdbfe',
                                            fontSize: '0.74rem',
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                          title="Click to re-assign employee"
                                        >
                                          👤 {resolveAssigneeDisplayNames(task.assignedTo)} ({task.storyPoints || 0} pts) ✏️
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => openAssignModal(pillar.id, subheading.id, task)}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            padding: '3px 10px',
                                            fontSize: '0.74rem',
                                            fontWeight: 700,
                                            color: '#475569',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.12s ease'
                                          }}
                                          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                                        >
                                          👤 Assign Task
                                        </button>
                                      )}

                                      {isEditMode && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTask(pillar.id, subheading.id, task.id)}
                                          style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}
                                          title="Delete task"
                                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                          onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {/* Inline Add Task Input (Only in Edit Mode) */}
                                {isEditMode && (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const input = e.target.elements[`newTask_${subheading.id}`];
                                      if (input && input.value) {
                                        handleAddTask(pillar.id, subheading.id, input.value);
                                        input.value = '';
                                      }
                                    }}
                                    style={{ display: 'flex', gap: '8px', marginTop: '6px' }}
                                  >
                                    <input
                                      type="text"
                                      name={`newTask_${subheading.id}`}
                                      placeholder="+ Write new task..."
                                      style={{
                                        flex: 1,
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.8rem',
                                        outline: 'none'
                                      }}
                                    />
                                    <button
                                      type="submit"
                                      style={{
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        fontSize: '0.76rem',
                                        fontWeight: 700,
                                        color: '#475569',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      + Add Task
                                    </button>
                                  </form>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Inline Add Subheading Input (Only in Edit Mode) */}
                          {isEditMode && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const input = e.target.elements[`newSub_${pillar.id}`];
                                if (input && input.value) {
                                  handleAddSubheading(pillar.id, input.value);
                                  input.value = '';
                                }
                              }}
                              style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}
                            >
                              <input
                                type="text"
                                name={`newSub_${pillar.id}`}
                                placeholder="+ Add new Subheading (e.g. HIRE CA FIRM)..."
                                style={{
                                  flex: 1,
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  outline: 'none'
                                }}
                              />
                              <button
                                type="submit"
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Add Subheading
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Inline Add Main Heading / Pillar Input (Only in Edit Mode) */}
                {isEditMode && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.target.elements.newPillarTitle;
                      if (input && input.value) {
                        handleAddPillar(input.value);
                        input.value = '';
                      }
                    }}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: '12px',
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px dashed #cbd5e1'
                    }}
                  >
                    <input
                      type="text"
                      name="newPillarTitle"
                      placeholder="+ Create new Main Heading / Pillar (e.g. Documentation, Marketing, Finance)..."
                      style={{
                        flex: 1,
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.82rem', background: '#ea580c', borderColor: '#ea580c' }}
                    >
                      + Add Main Heading
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ——— MODAL 1: CREATE / EDIT ACTION PLAN ——— */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                New Action Plan
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit}>
              {/* Target Project Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Target Project Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Project Name (e.g. My Startup Launch, Mobile App, Marketing)..."
                  value={modalProjectName}
                  onChange={(e) => setModalProjectName(e.target.value)}
                  required
                />
              </div>

              {/* Action Plan Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Action Plan Title *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  required
                />
              </div>

              {/* Timeline Params */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={modalStartDate}
                    onChange={(e) => setModalStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={modalDuration}
                    onChange={(e) => setModalDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Checkpoint (Days)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={modalCheckpoint}
                    onChange={(e) => setModalCheckpoint(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', background: '#ea580c', borderColor: '#ea580c' }}
                >
                  Create & Launch Action Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ——— MODAL 2: OPEN SHEET FULL VIEW ——— */}
      {showOpenSheetModal && activePlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '24px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '1100px',
            width: '100%',
            height: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  📄 Action Plan Full Sheet — {activePlan.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Comprehensive breakdown of pillars, milestones, and task completion
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  🖨️ Print / Export
                </button>
                <button
                  onClick={() => setShowOpenSheetModal(false)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 16px', background: '#475569' }}
                >
                  Close Sheet
                </button>
              </div>
            </div>

            <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
              {/* Top Banner Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Overall Progress</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{stats.overallPercent}%</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Items Done</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{stats.doneItems} / {stats.totalItems}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Timeline Day</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>Day {stats.dayElapsed} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>of {stats.duration}</span></div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Next Checkpoint</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ea580c', marginTop: '4px' }}>{stats.daysToCheckpoint} days</div>
                </div>
              </div>

              {/* Full Sheet Pillars Table */}
              {(activePlan.structure || []).map((pillar) => {
                const pillarStat = stats.pillarStats.find(s => s.id === pillar.id) || { percent: 0, doneCount: 0, totalCount: 0 };
                return (
                  <div key={pillar.id} style={{ marginBottom: '28px', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#f1f5f9', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{pillar.title}</strong>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>
                        {pillarStat.doneCount} / {pillarStat.totalCount} ({pillarStat.percent}%)
                      </span>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      {(pillar.subheadings || []).map(sub => (
                        <div key={sub.id} style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            {sub.title}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {(sub.tasks || []).map(t => (
                              <div key={t.id} style={{ fontSize: '0.84rem', color: t.completed ? '#94a3b8' : '#1e293b', textDecoration: t.completed ? 'line-through' : 'none' }}>
                                {t.completed ? '✅' : '⬜'} {t.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ——— MODAL: ASSIGN TASK TO EMPLOYEE ——— */}
      {showAssignModal && assigningTaskData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                👤 Assign Task to Employee
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Target Task:</div>
              <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>
                {assigningTaskData.task.title}
              </div>
            </div>

            <form onSubmit={handleAssignSubmit}>

              {/* STEP 1: Department Multi-Select Dropdown Menu */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#5e6c84', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  Department *
                </label>
                <CustomMultiSelectDropdown
                  options={departmentsList.map(d => d.name || d.title || d.Name || d)}
                  selectedValues={assignSelectedDepts}
                  onChange={setAssignSelectedDepts}
                  placeholder={departmentsList.length > 0 ? "-- Select Departments --" : "-- No Departments Added --"}
                />
              </div>

              {/* STEP 2: Employee Multi-Select Dropdown Menu (Filtered by selected departments) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#5e6c84', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  Assign To (Employee) *
                </label>
                <CustomMultiSelectDropdown
                  options={(() => {
                    const admins = usersList.filter(u =>
                      ['Admin', 'SuperAdmin', 'Founder'].includes(u.role)
                    );
                    const deptEmployees = assignSelectedDepts.length > 0
                      ? usersList.filter(u => {
                          if (['Admin', 'SuperAdmin', 'Founder'].includes(u.role)) return false;
                          const userDepts = (u.department || '').split(',').map(s => s.trim());
                          return assignSelectedDepts.some(sd => userDepts.includes(sd));
                        })
                      : usersList.filter(u => !['Admin', 'SuperAdmin', 'Founder'].includes(u.role));

                    const allVisible = [...admins, ...deptEmployees];
                    return allVisible.map(u => ({
                      value: u.full_name || u.name || u.email || `User #${u.id}`,
                      label: u.full_name || u.name || u.email || `User #${u.id}`,
                      subLabel: ['Admin', 'SuperAdmin', 'Founder'].includes(u.role) ? 'Admin' : u.role || 'Member'
                    }));
                  })()}
                  selectedValues={assignSelectedEmps}
                  onChange={setAssignSelectedEmps}
                  placeholder="-- Select Employees --"
                  emptyMessage="No employees found for selected departments"
                />
              </div>

              {/* Dates Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Story Points */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Story Points (Effort Estimate)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={assignStoryPoints}
                  onChange={(e) => setAssignStoryPoints(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.84rem', background: '#2563eb' }}
                >
                  🚀 Assign & Sync Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
