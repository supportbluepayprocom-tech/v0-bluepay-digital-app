# VISUAL REFERENCE - Create 6-Digit PIN Page

## Page Structure (Compact)

```
┌─────────────────────────────────────────┐
│     SECURE YOUR ACCOUNT                 │
│   Dear [User Name], create strong PIN   │
├─────────────────────────────────────────┤
│                                         │
│            [👤 Profile Pic]             │  Small circle upload
│            Picture Uploaded ✓           │
│                                         │
├─────────────────────────────────────────┤
│        6-DIGIT PIN FORM                 │
│        Lock Icon  | Eye Toggle Button 👁 │
│                                         │
│      [•] [•] [•] [•] [•] [•]            │  Each: 10x10px
│                                         │
│  If Eye Visible: [1] [2] [3] [4] [5] [6] │
│  If Eye Hidden:  [•] [•] [•] [•] [•] [•] │
│                                         │
│  PIN Security Tips:                     │
│  Use numbers you can remember...        │
│                                         │
│        [CREATE PIN BUTTON]              │
│        [FINGERPRINT BUTTON]             │
│                                         │
├─────────────────────────────────────────┤
│  Secure transactions with strong PIN    │
└─────────────────────────────────────────┘
```

## Fingerprint Scanner Modal

```
┌──────────────────────────────┐
│   SCANNING FINGERPRINT       │
│                              │
│     ◯◯◯◯◯ (Pulsing)         │
│      Fingerprint Icon        │
│                              │
│ Place your finger on sensor..│
│          [Loading...]        │
└──────────────────────────────┘

After Detection:
┌──────────────────────────────┐
│  FINGERPRINT VERIFIED ✓      │
│                              │
│     ◯◯◯◯◯ (Green)           │
│      Green Checkmark         │
│                              │
│ Your fingerprint detected    │
│ and verified successfully    │
└──────────────────────────────┘
```

## Eye Toggle Behavior

```
BEFORE (Default - Hidden):
┌────────────────────────────────┐
│ PIN            [👁‍🗨 Eye Icon]     │
├────────────────────────────────┤
│  [•] [•] [•] [•] [•] [•]       │
└────────────────────────────────┘

AFTER (Clicked - Visible):
┌────────────────────────────────┐
│ PIN            [👁 Eye Icon]    │
├────────────────────────────────┤
│  [1] [2] [3] [4] [5] [6]       │
└────────────────────────────────┘
```

## Color Scheme

- Background: Gradient (#0000FF to blue-900)
- Cards: White/10 with backdrop blur
- Text: White (primary), Blue-100 (secondary)
- Buttons: White background, blue text
- Accents: Green (#16A34A) for success
- Icons: Blue-200 for secondary

## Responsive Sizes

- Form Width: max-w-xs (320px)
- Profile Picture: w-20 h-20 (80x80px)
- PIN Boxes: w-10 h-10 (40x40px)
- Padding: p-4 to p-6 (compact)
- Gaps: gap-1.5 to gap-2

## Animations

1. **Fingerprint Pulse**: Continuous pulse effect during scanning
2. **Loading Spinner**: Rotating border animation
3. **Success Checkmark**: Appears after detection
4. **Eye Toggle**: Instant input type switch
5. **Hover Effects**: Button hover states

## Dashboard Integration

### Before:
```
Good Morning
John Doe
```

### After:
```
Good Morning, John
John Doe
```

The greeting now includes the user's name automatically!
