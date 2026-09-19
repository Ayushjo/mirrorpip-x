// ISO-3166 alpha-2 codes; display names resolved via Intl so we ship ~200
// countries without embedding a name table.
const CODES = [
  'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','KH','CM','CA','CV','CF','TD','CL','CN','CO','KM','CG','CR','HR','CU','CY','CZ','CD','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IL','IT','CI','JM','JP','JO','KZ','KE','KI','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','PR','QA','RO','RU','RW','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','KR','SS','ES','LK','KN','LC','VC','SD','SR','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VE','VN','YE','ZM','ZW',
] as const;

const names = new Intl.DisplayNames(['en'], { type: 'region' });

export const COUNTRIES: Array<{ code: string; name: string }> = CODES.map((code) => ({
  code,
  name: names.of(code) ?? code,
})).sort((a, b) => a.name.localeCompare(b.name));
