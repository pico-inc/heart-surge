export const ageGroupMap: { [key: string]: string } = {
  '10s': '10代',
  '20s': '20代',
  '30s': '30代',
  '40s': '40代',
  '50s': '50代',
  '60+': '60代以上',
};

export const getAgeGroupName = (code?: string): string => {
  if (!code) {
    return '';
  }
  return ageGroupMap[code];
};
