export const getDeviceTypeName = (type?: string): string => {
  const types: { [key: string]: string } = {
    'cochlear_implant': '人工内耳',
    'hearing_aid': '補聴器',
    'both': '人工内耳と補聴器',
    'none': '装用していない'
  };

  if (!type) return '';
  return types[type];
};

export const getHearingLevelName = (level?: string): string => {
  const levels: { [key: string]: string } = {
    'mild': '軽度難聴',
    'moderate': '中等度難聴',
    'severe': '重度難聴'
  };

  if (!level) return '';
  return levels[level];
};
