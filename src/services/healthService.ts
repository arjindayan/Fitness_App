import { Platform } from 'react-native';

// Lazy require to avoid crashes on non-iOS / missing module
let AppleHealthKit: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AppleHealthKit = require('react-native-health').default;
} catch (e) {
  AppleHealthKit = null;
}

function promisifyInit(permissions: any) {
  return new Promise<void>((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (err: Error | undefined) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function promisifyDailySteps(startDate: string, endDate: string) {
  return new Promise<number>((resolve, reject) => {
    AppleHealthKit.getDailyStepCountSamples(
      { startDate, endDate },
      (err: Error | undefined, results: { value: number }[] | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        const sum = (results ?? []).reduce((acc, item) => acc + (item.value ?? 0), 0);
        resolve(sum);
      }
    );
  });
}

export async function fetchTodayStepsWithPermission(): Promise<{ steps: number | null; error?: string }> {
  if (Platform.OS !== 'ios') {
    return { steps: null, error: 'HealthKit sadece iOS üzerinde desteklenir.' };
  }

  if (!AppleHealthKit) {
    return { steps: null, error: 'react-native-health paketi yüklü değil.' };
  }

  try {
    const permissions = {
      permissions: {
        read: [AppleHealthKit.Constants.Permissions.StepCount],
      },
    };

    await promisifyInit(permissions);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const stepCount = await promisifyDailySteps(start.toISOString(), end.toISOString());

    return { steps: stepCount };
  } catch (error: any) {
    return { steps: null, error: error?.message ?? 'HealthKit adım verisi okunamadı.' };
  }
}
