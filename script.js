// Database setup using Dexie
const db = new Dexie('TasbihDB');

// Define database schema
db.version(1).stores({
    adhkars: '++id, name, text, dailyLimit, createdAt',
    counts: '++id, adhkarId, date, count'
});

// Global variables
let adhkars = [];
let todaysCounts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadAdhkars();
    await loadTodaysCounts();
    renderAdhkars();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('addAdhkarBtn').addEventListener('click', showAddModal);
    document.getElementById('adhkarForm').addEventListener('submit', handleAddAdhkar);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            hideAddModal();
        }
    });
}

// Load adhkars from database
async function loadAdhkars() {
    try {
        adhkars = await db.adhkars.orderBy('createdAt').toArray();
    } catch (error) {
        console.error('Error loading adhkars:', error);
        adhkars = [];
    }
}

// Load today's counts from database
async function loadTodaysCounts() {
    const today = getTodayString();
    try {
        const counts = await db.counts.where('date').equals(today).toArray();
        todaysCounts = {};
        counts.forEach(count => {
            todaysCounts[count.adhkarId] = count.count;
        });
    } catch (error) {
        console.error('Error loading today\'s counts:', error);
        todaysCounts = {};
    }
}

// Get today's date as string (YYYY-MM-DD)
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

// Render adhkars on the page
function renderAdhkars() {
    const adhkarGrid = document.getElementById('adhkarGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (adhkars.length === 0) {
        adhkarGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    adhkarGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    adhkarGrid.innerHTML = adhkars.map(adhkar => {
        const currentCount = todaysCounts[adhkar.id] || 0;
        const remaining = Math.max(0, adhkar.dailyLimit - currentCount);
        const progress = Math.min(100, (currentCount / adhkar.dailyLimit) * 100);
        
        return `
            <div class="adhkar-card fade-in" data-id="${adhkar.id}">
                <div class="adhkar-header">
                    <div>
                        <div class="adhkar-name">${escapeHtml(adhkar.name)}</div>
                        ${adhkar.text ? `<div class="adhkar-text">${escapeHtml(adhkar.text)}</div>` : ''}
                    </div>
                    <button class="delete-btn" onclick="deleteAdhkar(${adhkar.id})" title="Delete Adhkar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="progress-section">
                    <div class="progress-info">
                        <span>Progress: ${currentCount}/${adhkar.dailyLimit}</span>
                        <span>Remaining: ${remaining}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <div class="count-display">
                    <div class="current-count">${currentCount}</div>
                    <div class="count-label">Today's Count</div>
                </div>
                
                <button class="counter-btn" onclick="incrementCount(${adhkar.id})" ${currentCount >= adhkar.dailyLimit ? 'style="opacity: 0.6;"' : ''}>
                    ${currentCount >= adhkar.dailyLimit ? 
                        '<i class="fas fa-check"></i> Target Completed!' : 
                        '<i class="fas fa-plus"></i> Count (+1)'}
                </button>
            </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show add adhkar modal
function showAddModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.add('active');
    document.getElementById('adhkarName').focus();
}

// Hide add adhkar modal
function hideAddModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.remove('active');
    document.getElementById('adhkarForm').reset();
}

// Handle add adhkar form submission
async function handleAddAdhkar(e) {
    e.preventDefault();
    
    const name = document.getElementById('adhkarName').value.trim();
    const text = document.getElementById('adhkarText').value.trim();
    const dailyLimit = parseInt(document.getElementById('dailyLimit').value);
    
    if (!name || dailyLimit < 1) {
        alert('Please enter a valid adhkar name and daily limit.');
        return;
    }
    
    try {
        const newAdhkar = {
            name,
            text,
            dailyLimit,
            createdAt: new Date()
        };
        
        await db.adhkars.add(newAdhkar);
        await loadAdhkars();
        renderAdhkars();
        hideAddModal();
        
        // Show success feedback
        showNotification('Adhkar added successfully!', 'success');
    } catch (error) {
        console.error('Error adding adhkar:', error);
        showNotification('Error adding adhkar. Please try again.', 'error');
    }
}

// Increment count for an adhkar
async function incrementCount(adhkarId) {
    const adhkar = adhkars.find(a => a.id === adhkarId);
    if (!adhkar) return;
    
    const currentCount = todaysCounts[adhkarId] || 0;
    
    // Don't increment if target is already reached
    if (currentCount >= adhkar.dailyLimit) {
        showNotification('Daily target already completed!', 'info');
        return;
    }
    
    const newCount = currentCount + 1;
    const today = getTodayString();
    
    try {
        // Update or create count record
        const existingCount = await db.counts
            .where('adhkarId').equals(adhkarId)
            .and(count => count.date === today)
            .first();
        
        if (existingCount) {
            await db.counts.update(existingCount.id, { count: newCount });
        } else {
            await db.counts.add({
                adhkarId,
                date: today,
                count: newCount
            });
        }
        
        // Update local state
        todaysCounts[adhkarId] = newCount;
        
        // Re-render to update UI
        renderAdhkars();
        
        // Add pulse animation to the card
        const card = document.querySelector(`[data-id="${adhkarId}"]`);
        if (card) {
            card.classList.add('pulse');
            setTimeout(() => card.classList.remove('pulse'), 300);
        }
        
        // Show completion message if target reached
        if (newCount >= adhkar.dailyLimit) {
            showNotification(`🎉 Target completed for ${adhkar.name}!`, 'success');
        }
        
    } catch (error) {
        console.error('Error updating count:', error);
        showNotification('Error updating count. Please try again.', 'error');
    }
}

// Delete an adhkar
async function deleteAdhkar(adhkarId) {
    const adhkar = adhkars.find(a => a.id === adhkarId);
    if (!adhkar) return;
    
    if (!confirm(`Are you sure you want to delete "${adhkar.name}"? This will also delete all associated count records.`)) {
        return;
    }
    
    try {
        // Delete the adhkar and all its count records
        await db.transaction('rw', db.adhkars, db.counts, async () => {
            await db.adhkars.delete(adhkarId);
            await db.counts.where('adhkarId').equals(adhkarId).delete();
        });
        
        // Update local state
        await loadAdhkars();
        await loadTodaysCounts();
        renderAdhkars();
        
        showNotification('Adhkar deleted successfully.', 'success');
    } catch (error) {
        console.error('Error deleting adhkar:', error);
        showNotification('Error deleting adhkar. Please try again.', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease;
            }
            
            .notification-success {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
            }
            
            .notification-error {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
            }
            
            .notification-info {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                gap: 15px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                font-size: 1rem;
                opacity: 0.8;
                transition: opacity 0.3s ease;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Reset counts at midnight
function scheduleResetAtMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        // Clear today's counts from memory
        todaysCounts = {};
        renderAdhkars();
        showNotification('New day started! Counts have been reset.', 'info');
        
        // Schedule the next reset
        scheduleResetAtMidnight();
    }, msUntilMidnight);
}

// Initialize midnight reset
scheduleResetAtMidnight();

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for global access
window.showAddModal = showAddModal;
window.hideAddModal = hideAddModal;
window.incrementCount = incrementCount;
window.deleteAdhkar = deleteAdhkar;