import { Easing, FadeIn, FadeInDown, FadeInUp, FadeOut, LinearTransition } from 'react-native-reanimated';

/**
 * Motion language of MShare: smooth, natural, no visible bounce (iOS-like critically damped
 * springs and ease-out curves). Use these presets everywhere instead of ad-hoc springs.
 */

/** Default spring: settles fast without overshoot. */
export const SPRING = { damping: 26, stiffness: 240, mass: 1, overshootClamping: true } as const;
/** Quick UI feedback (press, toggles, indicators). */
export const SNAPPY = { damping: 30, stiffness: 420, mass: 0.8, overshootClamping: true } as const;
/** Gentle large movements (sheets, pages). */
export const GENTLE = { damping: 28, stiffness: 160, mass: 1, overshootClamping: true } as const;

export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const DUR = { fast: 160, base: 240, slow: 360 } as const;

/** Entering animations: short fade + small rise, no spring overshoot. */
export const enterDown = (delay = 0) => FadeInDown.duration(DUR.slow).delay(delay).easing(EASE_OUT).withInitialValues({ opacity: 0, transform: [{ translateY: -10 }] });
export const enterUp = (delay = 0) => FadeInUp.duration(DUR.slow).delay(delay).easing(EASE_OUT).withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] });
export const fadeIn = (delay = 0) => FadeIn.duration(DUR.base).delay(delay).easing(EASE_OUT);
export const fadeOut = FadeOut.duration(DUR.fast);
export const layoutSmooth = LinearTransition.duration(DUR.base).easing(EASE_OUT);
