interface TimerMessages {
  halfwayMessages: string[];
  finalStretchMessages: string[];
  completionMessages: string[];
}

interface ModeMessages {
  [key: string]: TimerMessages;
}

export const TIMER_MESSAGES: ModeMessages = {
  gaming: {
    halfwayMessages: [
      "Halfway through your gaming session - you're doing great with time awareness!",
      "Nice! You're at the halfway point. How's the session going?",
      "Half your gaming time is done - perfect time for a quick stretch.",
      "Midpoint reached! Remember to blink and relax those eyes.",
      "Great job staying mindful of your gaming time so far."
    ],
    finalStretchMessages: [
      "Just a few minutes left - great time to find a stopping point.",
      "Almost time to wrap up. Finish this level/match and call it a win!",
      "Final minutes approaching - you've had a good session.",
      "Time to start thinking about a natural break point.",
      "Getting close to the end - you're building excellent gaming habits."
    ],
    completionMessages: [
      "Session complete! You stuck to your plan - that's real self-discipline.",
      "Time's up! Great job respecting your gaming boundaries.",
      "Well done! You've shown excellent time management.",
      "Session finished. Take a moment to appreciate your self-control.",
      "Perfect! You've balanced gaming with intentional time limits."
    ]
  },
  studying: {
    halfwayMessages: [
      "Fantastic! You're halfway through and building real focus momentum.",
      "Great progress! Your brain is in the learning zone right now.",
      "You're crushing this study session - keep that energy going!",
      "Halfway there! Your dedication is really showing.",
      "Excellent focus so far. You're developing strong study habits."
    ],
    finalStretchMessages: [
      "Final push! You're almost at the finish line - stay strong!",
      "Last few minutes - finish this concept and end on a high note!",
      "You're in the home stretch! Push through to complete this session.",
      "Almost done! Make these last minutes count.",
      "Final minutes - you've got this! Finish strong!"
    ],
    completionMessages: [
      "Amazing work! You just completed a full focused study session.",
      "Session complete! Your future self will thank you for this effort.",
      "Incredible! You've just invested in your success.",
      "Well done! You've built your knowledge and your discipline.",
      "Outstanding! You turned time into real learning progress."
    ]
  },
  work: {
    halfwayMessages: [
      "Solid progress! You're maintaining good focus on your objectives.",
      "Halfway through - you're making steady headway on your tasks.",
      "Great momentum! Keep channeling this productive energy.",
      "Midpoint reached. You're demonstrating excellent work discipline.",
      "Good pace! Your focused work time is paying off."
    ],
    finalStretchMessages: [
      "Final minutes - time to wrap up your current task effectively.",
      "Almost complete! Bring this work session to a strong close.",
      "Last stretch - finish what you're working on and call it productive.",
      "Approaching the end - complete your current focus area.",
      "Final phase - make these last minutes count toward your goals."
    ],
    completionMessages: [
      "Work session complete! You've made meaningful progress today.",
      "Excellent! You've maintained professional focus throughout.",
      "Session finished! Your consistent work habits are building success.",
      "Well executed! You've invested quality time in your responsibilities.",
      "Professional session complete! Your discipline is your competitive advantage."
    ]
  }
};

// Helper function to get a random message from an array
export function getRandomMessage(messages: string[]): string {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Get the appropriate message set based on timer mode
export function getMessageSet(mode: string): TimerMessages {
  const normalizedMode = mode.toLowerCase();
  // Map custom modes or variations to our base message sets
  const modeMap: { [key: string]: string } = {
    'studying': 'studying',
    'study': 'studying',
    'gaming': 'gaming',
    'game': 'gaming',
    'work': 'work',
    'working': 'work',
    'break': 'break'
  };

  const mappedMode = modeMap[normalizedMode] || 'work'; // Default to work messages
  return TIMER_MESSAGES[mappedMode] || TIMER_MESSAGES.work;
}