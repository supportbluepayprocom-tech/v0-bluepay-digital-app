export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()

  // 12:00 AM to 11:59 AM (hours 0-11)
  if (hour < 12) {
    return 'Good Morning'
  }

  // 12:00 PM to 4:59 PM (hours 12-16)
  if (hour < 17) {
    return 'Good Afternoon'
  }

  // 5:00 PM to 11:59 PM (hours 17-23)
  return 'Good Evening'
}
