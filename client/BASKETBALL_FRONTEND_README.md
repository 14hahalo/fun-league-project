# Basketball Statistics Frontend

This document describes the React frontend implementation for the basketball statistics system.

## Features

### 1. **Game Statistics Management**
- Input player statistics for each game
- Real-time calculation of shooting percentages, rebounds, and points
- Support for two teams (Team A and Team B)
- Form validation with Zod schema
- Automatic team statistics aggregation

### 2. **Interactive UI**
- **Input Mode**: Add and manage player statistics
- **View Mode**: Display team and player statistics in a clean, organized layout
- Tab-based navigation between teams
- Responsive design for mobile and desktop

### 3. **Statistics Tracked**
- **Shooting**: 2-point and 3-point attempts, makes, and percentages
- **Rebounds**: Defensive, offensive, and total rebounds
- **Assists**: Player assists
- **Total Points**: Automatically calculated

## File Structure

```
client/src/
├── api/
│   └── basketballApi.ts           # API service layer for basketball endpoints
├── components/
│   └── basketball/
│       ├── StatCard.tsx           # Reusable stat display card
│       ├── PlayerStatRow.tsx      # Player statistics table row
│       ├── TeamStatsDisplay.tsx   # Team statistics display component
│       └── PlayerStatsForm.tsx    # Form for entering player stats
├── hooks/
│   └── useBasketballStats.ts      # Custom hook for basketball data management
├── pages/
│   └── GameStatsPage.tsx          # Main game statistics page
├── types/
│   └── basketball.types.ts        # TypeScript interfaces and enums
└── App.tsx                         # Updated with new route

```

## Components

### StatCard
Reusable card component for displaying individual statistics.

**Props:**
- `label`: Stat label
- `value`: Stat value
- `subtitle`: Optional subtitle
- `variant`: Visual variant (default, highlight, success, warning)
- `icon`: Optional icon

### PlayerStatRow
Table row component for displaying player statistics.

**Props:**
- `stats`: Player statistics with player info
- `onEdit`: Optional edit callback
- `onDelete`: Optional delete callback
- `showActions`: Show action buttons

### TeamStatsDisplay
Component for displaying aggregated team statistics.

**Props:**
- `stats`: Team statistics
- `teamName`: Optional team name

### PlayerStatsForm
Form component for entering player statistics with validation.

**Props:**
- `gameId`: Game identifier
- `availablePlayers`: List of available players
- `teamType`: Team type (TEAM_A or TEAM_B)
- `onSubmit`: Submit callback
- `onCancel`: Optional cancel callback
- `initialData`: Optional initial form data

## Custom Hook: useBasketballStats

Manages all basketball statistics operations:

```typescript
const {
  playerStats,         // Array of player statistics
  teamStats,           // Array of team statistics
  teams,               // Array of teams
  loading,             // Loading state
  error,               // Error message
  fetchPlayerStatsByGame,
  fetchTeamStatsByGame,
  fetchTeamsByGame,
  fetchAllGameData,    // Fetch all data at once
  createPlayerStats,
  updatePlayerStats,
  deletePlayerStats,
  createTeam,
  generateTeamStats,
} = useBasketballStats();
```

## Pages

### GameStatsPage (`/game/:gameId/stats`)

Main page for managing and viewing game statistics.

**Features:**
- Toggle between Input and View modes
- Add player statistics with form validation
- View statistics by team
- Delete player statistics
- Generate/view team statistics
- Responsive layout

**URL Parameters:**
- `gameId`: The game identifier

## API Integration

All API calls are handled through the `basketballApi.ts` service layer:

```typescript
import { playerStatsApi, teamStatsApi, teamApi } from '../api/basketballApi';

// Example: Create player stats
const newStats = await playerStatsApi.createPlayerStats({
  gameId: 'game123',
  playerId: 'player456',
  teamType: TeamType.TEAM_A,
  twoPointAttempts: 10,
  twoPointMade: 7,
  // ... other stats
});
```

## Type Safety

All components and hooks are fully typed with TypeScript:

```typescript
interface PlayerStats {
  id: string;
  gameId: string;
  playerId: string;
  teamType: TeamType;
  twoPointAttempts: number;
  twoPointMade: number;
  twoPointPercentage: number;
  // ... more fields
}
```

## Form Validation

Uses Zod schema validation with React Hook Form:

```typescript
const playerStatsSchema = z.object({
  playerId: z.string().min(1, 'Oyuncu seçimi zorunludur'),
  twoPointAttempts: z.number().min(0, 'Negatif olamaz'),
  twoPointMade: z.number().min(0, 'Negatif olamaz'),
  // ... more fields
}).refine((data) => data.twoPointMade <= data.twoPointAttempts, {
  message: '2 sayılık isabetli sayısı denemeden fazla olamaz',
  path: ['twoPointMade'],
});
```

## Styling

- **Tailwind CSS** for utility-first styling
- Responsive design with breakpoints
- Orange theme with blue/red accents for teams
- Hover effects and transitions
- Mobile-optimized tables and forms

## Usage Example

### 1. Navigate to Game Stats
Click "Maç İstatistikleri" in the navigation bar.

### 2. Add Player Statistics
1. Click "+ Yeni İstatistik" button
2. Select player and team
3. Enter shooting statistics (2P and 3P attempts/makes)
4. Enter rebounds and assists
5. View calculated total points
6. Click "İstatistikleri Kaydet"

### 3. View Statistics
1. Switch to "Sonuçlar" tab
2. View team statistics for both teams
3. View individual player statistics
4. Generate team statistics if not already created

## Key Features

### Automatic Calculations
- Shooting percentages calculated automatically
- Total rebounds = defensive + offensive
- Total points = (2P made × 2) + (3P made × 3)

### Team Statistics
- Automatically aggregated from player stats
- Generated on-demand or when player stats change
- Includes all shooting, rebounding, and assist totals

### Data Validation
- Form-level validation with Zod
- Business logic validation (makes ≤ attempts)
- Required field validation
- Negative number prevention

### User Experience
- Loading states during API calls
- Error messages in Turkish
- Confirmation dialogs for destructive actions
- Real-time calculations in forms
- Responsive design for all screen sizes

## Responsive Design

- **Mobile**: Single column layout, simplified tables
- **Tablet**: Two columns for teams, optimized spacing
- **Desktop**: Full layout with side-by-side team comparisons

## Color Scheme

- **Primary**: Orange (#f97316)
- **Team A**: Blue
- **Team B**: Red
- **Success**: Green
- **Error**: Red
- **Neutral**: Gray scale

## Best Practices Used

1. **Component Composition**: Small, reusable components
2. **Custom Hooks**: Encapsulated data management logic
3. **Type Safety**: Full TypeScript coverage
4. **Validation**: Zod schema validation
5. **Error Handling**: Try-catch with user-friendly messages
6. **Loading States**: Visual feedback during async operations
7. **Responsive Design**: Mobile-first approach
8. **Code Organization**: Clear folder structure
9. **API Abstraction**: Centralized API service layer
10. **Form Management**: React Hook Form for optimal performance

## Testing the Frontend

1. Start the backend server:
   ```bash
   cd domain
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd client
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

4. Navigate to "Maç İstatistikleri"

5. Add test data using the form

## Environment Variables

Make sure `.env` file in the client folder has:

```env
VITE_API_URL=http://localhost:3000/api
```

## Future Enhancements

- Game list/selection page
- Player performance charts and graphs
- Season statistics aggregation
- Player comparison tools
- Export statistics to PDF/Excel
- Real-time updates with WebSockets
- Advanced filtering and search
- Player photos in statistics view
- Mobile app version
