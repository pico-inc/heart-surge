export const occupationMap: { [key: string]: string } = {
  'student': '学生',
  'employed': '雇用者',
  'self-employed': '自営業',
  'unemployed': '無職',
};

export const getOccupationName = (code?: string): string => {
  if (!code) {
    return '';
  }
  return occupationMap[code];
};
