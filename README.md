# SoundRoom

An Ableton-inspired digital audio workstation (DAW) for creating and arranging sound waves.

## Features

- **Waveform Editor**: Draw custom waveforms by hand or use predefined waveform types (sine, square, triangle, sawtooth)
- **Effects**: Apply reverb and distortion effects to your sounds
- **Sound Transformation**: Apply effects like smoothing, stretching, and arpeggio to your waveforms
- **Timeline**: Arrange your sounds on a multi-track timeline
- **MIDI Export**: Export your creations as MIDI files

## Technologies Used

- **Next.js**: React framework with App Router
- **TypeScript**: For type safety and better developer experience
- **Tone.js**: WebAudio framework for sound synthesis
- **Zustand**: Lightweight state management
- **Shadcn UI & Radix UI**: Component library and accessible primitives
- **Tailwind CSS**: Utility-first CSS framework

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser

## Usage

### Creating Sounds

1. Use the Waveform Editor to draw a sound wave
2. Configure waveform type, effects and grid settings using the panel on the right
3. Press Play to hear your creation
4. Save the sound to add it to your library

### Arranging on Timeline

1. Saved sounds appear in the library panel
2. Drag sounds to the timeline to arrange them
3. Use the playhead to navigate through your composition
4. Play the entire timeline to hear your arrangement

### Exporting

- Use the Export MIDI button to download your creation as a MIDI file

## Project Structure

- `src/app/`: Next.js App Router pages
- `src/components/`: UI components grouped by feature
  - `waveform/`: Components for waveform editing
  - `timeline/`: Components for timeline arrangement
  - `ui/`: Shadcn UI components
- `src/store/`: Zustand store for application state
- `src/services/`: Audio engine and other services
- `src/types/`: TypeScript type definitions
- `src/utils/`: Utility functions for waveform processing and MIDI export

## License

MIT License
