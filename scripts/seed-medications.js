/**
 * 藥物數據庫種子腳本
 * 預置常用藥物和交互作用數據
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 常用藥物數據
const medications = [
  {
    drug_code: 'WAR001',
    drug_name: '可邁丁',
    generic_name: 'Warfarin',
    drug_name_en: 'Coumadin',
    category: '抗凝血劑',
    atc_code: 'B01AA03',
    therapeutic_class: 'Anticoagulants',
    dosage_form: '錠劑',
    strength: '5',
    unit: 'mg',
    standard_dosage: '2-10mg每日一次',
    max_daily_dose: '10mg',
    administration_route: ['口服'],
    frequency_options: ['每日一次', '每日兩次'],
    contraindications: ['懷孕', '嚴重出血傾向', '嚴重肝病', '近期手術或創傷'],
    warnings: ['需定期監測INR', '避免與阿斯匹靈併用', '注意出血風險'],
    side_effects: ['出血', '皮疹', '腹瀉', '噁心'],
    pregnancy_category: 'X',
    is_nhi_covered: true,
    nhi_price: 2.5,
    manufacturer: '台灣製藥公司'
  },
  {
    drug_code: 'ASP001',
    drug_name: '阿斯匹靈',
    generic_name: 'Aspirin',
    drug_name_en: 'Aspirin',
    category: '解熱鎮痛劑',
    atc_code: 'N02BA01',
    therapeutic_class: 'NSAIDs',
    dosage_form: '錠劑',
    strength: '100',
    unit: 'mg',
    standard_dosage: '75-325mg每日一次',
    max_daily_dose: '325mg',
    administration_route: ['口服'],
    frequency_options: ['每日一次'],
    contraindications: ['胃潰瘍', '出血傾向', '對阿斯匹靈過敏', '嚴重腎功能不全'],
    warnings: ['飯後服用', '注意胃腸道出血', '兒童使用需注意雷氏症候群'],
    side_effects: ['胃痛', '噁心', '出血'],
    pregnancy_category: 'C',
    is_nhi_covered: true,
    nhi_price: 1.0,
    manufacturer: '拜耳'
  },
  {
    drug_code: 'DIG001',
    drug_name: '毛地黃',
    generic_name: 'Digoxin',
    drug_name_en: 'Lanoxin',
    category: '強心劑',
    atc_code: 'C01AA05',
    therapeutic_class: 'Cardiac Glycosides',
    dosage_form: '錠劑',
    strength: '0.25',
    unit: 'mg',
    standard_dosage: '0.125-0.25mg每日一次',
    max_daily_dose: '0.5mg',
    administration_route: ['口服'],
    frequency_options: ['每日一次'],
    contraindications: ['房室傳導阻滯', '心室心律不整', '低血鉀'],
    warnings: ['治療窗窄', '需監測血中濃度', '注意毒性症狀'],
    side_effects: ['噁心', '嘔吐', '視覺異常', '心律不整'],
    pregnancy_category: 'C',
    is_nhi_covered: true,
    nhi_price: 3.2,
    manufacturer: 'GSK'
  },
  {
    drug_code: 'MET001',
    drug_name: '美福明',
    generic_name: 'Metformin',
    drug_name_en: 'Glucophage',
    category: '降血糖藥',
    atc_code: 'A10BA02',
    therapeutic_class: 'Biguanides',
    dosage_form: '錠劑',
    strength: '500',
    unit: 'mg',
    standard_dosage: '500-2000mg每日',
    max_daily_dose: '2550mg',
    administration_route: ['口服'],
    frequency_options: ['每日兩次', '每日三次'],
    contraindications: ['腎功能不全', '嚴重感染', '脫水', '酒精中毒'],
    warnings: ['需定期檢查腎功能', '避免與顯影劑同時使用', '注意乳酸中毒風險'],
    side_effects: ['腹瀉', '噁心', '腹脹', '金屬味'],
    pregnancy_category: 'B',
    is_nhi_covered: true,
    nhi_price: 2.0,
    manufacturer: 'Merck'
  },
  {
    drug_code: 'LIS001',
    drug_name: '賴諾普利',
    generic_name: 'Lisinopril',
    drug_name_en: 'Prinivil',
    category: 'ACE抑制劑',
    atc_code: 'C09AA03',
    therapeutic_class: 'ACE Inhibitors',
    dosage_form: '錠劑',
    strength: '10',
    unit: 'mg',
    standard_dosage: '5-40mg每日一次',
    max_daily_dose: '40mg',
    administration_route: ['口服'],
    frequency_options: ['每日一次'],
    contraindications: ['懷孕', '雙側腎動脈狹窄', '血管性水腫病史'],
    warnings: ['首次服用可能低血壓', '定期監測腎功能', '避免與鉀補充劑併用'],
    side_effects: ['咳嗽', '頭暈', '高血鉀', '疲勞'],
    pregnancy_category: 'D',
    is_nhi_covered: true,
    nhi_price: 4.5,
    manufacturer: 'AstraZeneca'
  },
  {
    drug_code: 'AMO001',
    drug_name: '安莫西林',
    generic_name: 'Amoxicillin',
    drug_name_en: 'Amoxil',
    category: '抗生素',
    atc_code: 'J01CA04',
    therapeutic_class: 'Penicillins',
    dosage_form: '膠囊',
    strength: '500',
    unit: 'mg',
    standard_dosage: '250-500mg每8小時',
    max_daily_dose: '3000mg',
    administration_route: ['口服'],
    frequency_options: ['每8小時', '每12小時'],
    contraindications: ['青黴素過敏'],
    warnings: ['完成整個療程', '注意過敏反應', '可能影響避孕效果'],
    side_effects: ['腹瀉', '噁心', '皮疹', '嘔吐'],
    pregnancy_category: 'B',
    is_nhi_covered: true,
    nhi_price: 5.0,
    manufacturer: 'GSK'
  },
  {
    drug_code: 'ATO001',
    drug_name: '立普妥',
    generic_name: 'Atorvastatin',
    drug_name_en: 'Lipitor',
    category: '降血脂藥',
    atc_code: 'C10AA05',
    therapeutic_class: 'Statins',
    dosage_form: '錠劑',
    strength: '20',
    unit: 'mg',
    standard_dosage: '10-80mg每日一次',
    max_daily_dose: '80mg',
    administration_route: ['口服'],
    frequency_options: ['每日一次'],
    contraindications: ['活動性肝病', '懷孕', '哺乳'],
    warnings: ['可能肌肉病變', '定期檢查肝功能', '避免葡萄柚汁'],
    side_effects: ['肌肉痛', '頭痛', '腹瀉', '肝酵素升高'],
    pregnancy_category: 'X',
    is_nhi_covered: true,
    nhi_price: 10.0,
    manufacturer: 'Pfizer'
  },
  {
    drug_code: 'OME001',
    drug_name: '耐適恩',
    generic_name: 'Omeprazole',
    drug_name_en: 'Prilosec',
    category: '胃藥',
    atc_code: 'A02BC01',
    therapeutic_class: 'Proton Pump Inhibitors',
    dosage_form: '膠囊',
    strength: '20',
    unit: 'mg',
    standard_dosage: '20-40mg每日一次',
    max_daily_dose: '40mg',
    administration_route: ['口服'],
    frequency_options: ['每日一次'],
    contraindications: ['對本品過敏'],
    warnings: ['長期使用需注意', '可能影響鈣、鎂、維生素B12吸收', '飯前服用'],
    side_effects: ['頭痛', '腹瀉', '噁心', '腹痛'],
    pregnancy_category: 'C',
    is_nhi_covered: true,
    nhi_price: 8.0,
    manufacturer: 'AstraZeneca'
  },
  {
    drug_code: 'LEV001',
    drug_name: '左旋可待因',
    generic_name: 'Levocetirizine',
    drug_name_en: 'Xyzal',
    category: '抗組織胺',
    atc_code: 'R06AE09',
    therapeutic_class: 'Antihistamines',
    dosage_form: '錠劑',
    strength: '5',
    unit: 'mg',
    standard_dosage: '5mg每日一次',
    max_daily_dose: '5mg',
    administration_route: ['口服'],
    frequency_options: ['每日一次'],
    contraindications: ['嚴重腎功能不全', '末期腎病'],
    warnings: ['可能嗜睡', '避免駕駛', '避免飲酒'],
    side_effects: ['嗜睡', '疲倦', '口乾', '頭痛'],
    pregnancy_category: 'B',
    is_nhi_covered: true,
    nhi_price: 6.5,
    manufacturer: 'UCB'
  },
  {
    drug_code: 'PAR001',
    drug_name: '普拿疼',
    generic_name: 'Paracetamol',
    drug_name_en: 'Panadol',
    category: '解熱鎮痛劑',
    atc_code: 'N02BE01',
    therapeutic_class: 'Analgesics',
    dosage_form: '錠劑',
    strength: '500',
    unit: 'mg',
    standard_dosage: '500-1000mg每4-6小時',
    max_daily_dose: '4000mg',
    administration_route: ['口服'],
    frequency_options: ['每4-6小時', '需要時使用'],
    contraindications: ['嚴重肝功能不全'],
    warnings: ['不可超過最大劑量', '避免飲酒', '注意肝毒性'],
    side_effects: ['少見', '過量可致肝衰竭'],
    pregnancy_category: 'B',
    is_nhi_covered: true,
    nhi_price: 1.5,
    manufacturer: 'GSK'
  }
];

// 藥物交互作用數據
const interactions = [
  {
    drug_a_code: 'WAR001', // Warfarin
    drug_b_code: 'ASP001', // Aspirin
    severity: 'major',
    interaction_type: '藥效學交互作用',
    description: 'Warfarin 與 Aspirin 併用會顯著增加出血風險',
    mechanism: '兩者皆具抗凝血作用，併用會產生加成效果',
    clinical_effect: '可能導致嚴重出血，包括腦出血、消化道出血等',
    recommendation: '除非有明確適應症，否則應避免併用。如必須併用，需密切監測INR和出血症狀，並考慮降低劑量',
    evidence_level: 'A',
    documentation_quality: 'Excellent'
  },
  {
    drug_a_code: 'WAR001', // Warfarin
    drug_b_code: 'DIG001', // Digoxin
    severity: 'moderate',
    interaction_type: '藥物動力學交互作用',
    description: 'Warfarin 可能增加 Digoxin 的血中濃度',
    mechanism: 'Warfarin 可能影響 Digoxin 的代謝',
    clinical_effect: '可能增加 Digoxin 毒性風險',
    recommendation: '併用時應監測 Digoxin 血中濃度和臨床症狀',
    evidence_level: 'B',
    documentation_quality: 'Good'
  },
  {
    drug_a_code: 'ASP001', // Aspirin
    drug_b_code: 'LIS001', // Lisinopril
    severity: 'moderate',
    interaction_type: '藥效學交互作用',
    description: 'Aspirin 可能降低 ACE 抑制劑的降壓效果',
    mechanism: 'NSAIDs 可能抑制前列腺素合成，減弱 ACE 抑制劑的效果',
    clinical_effect: '血壓控制可能變差，腎功能可能惡化',
    recommendation: '監測血壓和腎功能，必要時調整劑量',
    evidence_level: 'B',
    documentation_quality: 'Good'
  },
  {
    drug_a_code: 'DIG001', // Digoxin
    drug_b_code: 'AMO001', // Amoxicillin
    severity: 'minor',
    interaction_type: '藥物動力學交互作用',
    description: '某些抗生素可能影響 Digoxin 的吸收',
    mechanism: '抗生素可能改變腸道菌叢，影響 Digoxin 代謝',
    clinical_effect: 'Digoxin 血中濃度可能改變',
    recommendation: '監測 Digoxin 血中濃度，必要時調整劑量',
    evidence_level: 'C',
    documentation_quality: 'Fair'
  },
  {
    drug_a_code: 'MET001', // Metformin
    drug_b_code: 'LIS001', // Lisinopril
    severity: 'minor',
    interaction_type: '藥效學交互作用',
    description: 'ACE 抑制劑可能增強 Metformin 的降血糖效果',
    mechanism: 'ACE 抑制劑可能改善胰島素敏感性',
    clinical_effect: '血糖可能下降',
    recommendation: '監測血糖，必要時調整劑量',
    evidence_level: 'C',
    documentation_quality: 'Fair'
  },
  {
    drug_a_code: 'ATO001', // Atorvastatin
    drug_b_code: 'DIG001', // Digoxin
    severity: 'moderate',
    interaction_type: '藥物動力學交互作用',
    description: 'Atorvastatin 可能增加 Digoxin 的血中濃度',
    mechanism: 'Statin 類藥物可能影響 P-glycoprotein，減少 Digoxin 排除',
    clinical_effect: 'Digoxin 毒性風險增加',
    recommendation: '開始併用或調整劑量時，應監測 Digoxin 血中濃度',
    evidence_level: 'B',
    documentation_quality: 'Good'
  },
  {
    drug_a_code: 'OME001', // Omeprazole
    drug_b_code: 'WAR001', // Warfarin
    severity: 'moderate',
    interaction_type: '藥物動力學交互作用',
    description: 'Omeprazole 可能增強 Warfarin 的抗凝血效果',
    mechanism: 'Omeprazole 抑制 CYP2C19，減少 Warfarin 代謝',
    clinical_effect: '出血風險增加',
    recommendation: '密切監測 INR，必要時調整 Warfarin 劑量',
    evidence_level: 'B',
    documentation_quality: 'Good'
  },
  {
    drug_a_code: 'PAR001', // Paracetamol
    drug_b_code: 'WAR001', // Warfarin
    severity: 'moderate',
    interaction_type: '藥效學交互作用',
    description: '長期或高劑量使用 Paracetamol 可能增強 Warfarin 的效果',
    mechanism: '機轉不明確',
    clinical_effect: 'INR 可能升高，出血風險增加',
    recommendation: '如需長期使用 Paracetamol，應更頻繁監測 INR',
    evidence_level: 'B',
    documentation_quality: 'Good'
  }
];

async function seedMedications() {
  console.log('🚀 開始導入藥物數據...\n');

  // 1. 導入藥物
  console.log('📦 導入藥物資料...');
  const medicationIds = {};
  
  for (const med of medications) {
    console.log(`  導入: ${med.drug_name} (${med.generic_name})`);
    
    const { data, error } = await supabase
      .from('medications')
      .upsert(med, { onConflict: 'drug_code' })
      .select('id, drug_code');

    if (error) {
      console.error(`  ✗ 失敗: ${error.message}`);
    } else {
      medicationIds[med.drug_code] = data[0].id;
      console.log(`  ✓ 成功: ${med.drug_code}`);
    }
  }

  console.log(`\n✅ 藥物導入完成！共 ${Object.keys(medicationIds).length} 種藥物\n`);

  // 2. 導入交互作用
  console.log('🔗 導入藥物交互作用...');
  let interactionCount = 0;

  for (const interaction of interactions) {
    const drugAId = medicationIds[interaction.drug_a_code];
    const drugBId = medicationIds[interaction.drug_b_code];

    if (!drugAId || !drugBId) {
      console.log(`  ⚠ 跳過: ${interaction.drug_a_code} <-> ${interaction.drug_b_code} (藥物不存在)`);
      continue;
    }

    const interactionData = {
      drug_a_id: drugAId,
      drug_b_id: drugBId,
      severity: interaction.severity,
      interaction_type: interaction.interaction_type,
      description: interaction.description,
      mechanism: interaction.mechanism,
      clinical_effect: interaction.clinical_effect,
      recommendation: interaction.recommendation,
      evidence_level: interaction.evidence_level,
      documentation_quality: interaction.documentation_quality,
      reference_links: interaction.reference_links || []
    };

    console.log(`  導入: ${interaction.drug_a_code} <-> ${interaction.drug_b_code}`);

    const { error } = await supabase
      .from('drug_interactions')
      .upsert(interactionData);

    if (error) {
      console.error(`  ✗ 失敗: ${error.message}`);
    } else {
      interactionCount++;
      console.log(`  ✓ 成功: ${interaction.severity} severity`);
    }
  }

  console.log(`\n✅ 交互作用導入完成！共 ${interactionCount} 筆記錄\n`);

  // 3. 統計摘要
  console.log('📊 數據庫統計：');
  const { count: medCount } = await supabase
    .from('medications')
    .select('*', { count: 'exact', head: true });
  
  const { count: interCount } = await supabase
    .from('drug_interactions')
    .select('*', { count: 'exact', head: true });

  console.log(`  - 藥物總數: ${medCount}`);
  console.log(`  - 交互作用總數: ${interCount}`);
  console.log('\n🎉 所有數據導入完成！');
}

// 執行
seedMedications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 導入失敗:', error);
    process.exit(1);
  });

