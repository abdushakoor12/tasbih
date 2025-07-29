# Tasbih - Digital Prayer Counter

A beautiful, modern web application for counting Islamic prayers and remembrances (adhkar) with offline support and daily progress tracking.

## Features

✨ **Core Features:**
- Add and remove custom adhkars (Islamic remembrances)
- Set daily targets for each adhkar
- Track daily progress with visual progress bars
- Beautiful, responsive UI with Islamic-inspired design
- Offline support with service worker
- Data persistence using IndexedDB

🎯 **Key Functionality:**
- **Daily Tracking**: Automatically tracks counts per day
- **Progress Visualization**: Beautiful progress bars and completion indicators
- **Target Management**: Set custom daily limits (e.g., 100 SubhanAllah)
- **Data Persistence**: All data stored locally in your browser
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Offline Support**: Continue using the app even without internet

## Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Database**: Dexie.js (IndexedDB wrapper)
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)
- **No Build Process**: Pure vanilla implementation

## Getting Started

### Usage

1. **Add Your First Adhkar**:
   - Click the "Add Adhkar" button
   - Enter the name (e.g., "SubhanAllah", "Alhamdulillah")
   - Optionally add the full Arabic text
   - Set your daily target (default: 100)
   - Click "Add Adhkar"

2. **Start Counting**:
   - Click the count button on any adhkar card
   - Watch your progress grow with the visual progress bar
   - Get notified when you complete your daily target

3. **Manage Your Adhkars**:
   - Delete adhkars you no longer need
   - View remaining counts for the day
   - Track your daily spiritual progress

## File Structure

```
tasbih/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # JavaScript functionality
├── sw.js              # Service worker for offline support
└── README.md          # This file
```

## Features in Detail

### Database Schema

The app uses two main tables:

**Adhkars Table:**
- `id`: Unique identifier
- `name`: Name of the adhkar
- `text`: Optional full text
- `dailyLimit`: Target count per day
- `createdAt`: Creation timestamp

**Counts Table:**
- `id`: Unique identifier
- `adhkarId`: Reference to adhkar
- `date`: Date (YYYY-MM-DD format)
- `count`: Number of times counted

### Daily Reset

The app automatically resets counts at midnight, allowing you to start fresh each day while preserving historical data.

### Offline Support

The service worker caches all necessary files, allowing the app to work offline. Your data is always available since it's stored locally in IndexedDB.

## Privacy

🔒 **Your data stays private:**
- All data is stored locally in your browser
- No data is sent to external servers
- No tracking or analytics
- Works completely offline

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Submit pull requests

## Acknowledgments

- **Dexie.js** for the excellent IndexedDB wrapper
- **Font Awesome** for the beautiful icons
- **Google Fonts** for the Inter font family

---

**May this app help you in your spiritual journey and remembrance of Allah (SWT). Barakallahu feek!** 🤲

*"And remember your Lord much and exalt [Him with praise] in the evening and the morning."* - Quran 3:41