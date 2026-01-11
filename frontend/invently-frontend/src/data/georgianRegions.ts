// Georgian regions and districts data
export interface District {
  id: string;
  name: string;
  nameKa: string;
}

export interface Region {
  id: string;
  name: string;
  nameKa: string;
  center: {
    lat: number;
    lng: number;
  };
  districts: District[];
}

export const georgianRegions: Region[] = [
  {
    id: 'tbilisi',
    name: 'Tbilisi',
    nameKa: 'თბილისი',
    center: { lat: 41.7151, lng: 44.8271 },
    districts: [
      { id: 'vake', name: 'Vake', nameKa: 'ვაკე' },
      { id: 'saburtalo', name: 'Saburtalo', nameKa: 'საბურთალო' },
      { id: 'didube', name: 'Didube', nameKa: 'დიდუბე' },
      { id: 'gldani', name: 'Gldani', nameKa: 'გლდანი' },
      { id: 'nadzaladevi', name: 'Nadzaladevi', nameKa: 'ნაძალადევი' },
      { id: 'isani', name: 'Isani', nameKa: 'ისანი' },
      { id: 'samgori', name: 'Samgori', nameKa: 'სამგორი' },
      { id: 'krtsanisi', name: 'Krtsanisi', nameKa: 'კრწანისი' },
      { id: 'mtatsminda', name: 'Mtatsminda', nameKa: 'მთაწმინდა' },
      { id: 'chughureti', name: 'Chughureti', nameKa: 'ჩუღურეთი' },
      { id: 'avlabari', name: 'Avlabari', nameKa: 'ავლაბარი' },
      { id: 'ortachala', name: 'Ortachala', nameKa: 'ორთაჭალა' },
      { id: 'dighomi', name: 'Dighomi', nameKa: 'დიღომი' },
      { id: 'varketili', name: 'Varketili', nameKa: 'ვარკეთილი' },
      { id: 'temqa', name: 'Temqa', nameKa: 'თემქა' },
      { id: 'lilo', name: 'Lilo', nameKa: 'ლილო' },
      { id: 'ponichala', name: 'Ponichala', nameKa: 'ფონიჭალა' },
      { id: 'sololaki', name: 'Sololaki', nameKa: 'სოლოლაკი' },
      { id: 'vera', name: 'Vera', nameKa: 'ვერა' },
      { id: 'kiketi', name: 'Kiketi', nameKa: 'კიკეთი' },
      { id: 'tskneti', name: 'Tskneti', nameKa: 'წყნეთი' },
      { id: 'okrokana', name: 'Okrokana', nameKa: 'ოქროყანა' },
    ],
  },
  {
    id: 'batumi',
    name: 'Batumi',
    nameKa: 'ბათუმი',
    center: { lat: 41.6168, lng: 41.6367 },
    districts: [
      { id: 'batumi-center', name: 'Center', nameKa: 'ცენტრი' },
      { id: 'batumi-old-town', name: 'Old Town', nameKa: 'ძველი ქალაქი' },
      { id: 'batumi-airport', name: 'Airport Area', nameKa: 'აეროპორტი' },
      { id: 'batumi-boulevard', name: 'Boulevard', nameKa: 'ბულვარი' },
      { id: 'batumi-gonio', name: 'Gonio', nameKa: 'გონიო' },
      { id: 'batumi-khelvachauri', name: 'Khelvachauri', nameKa: 'ხელვაჩაური' },
    ],
  },
  {
    id: 'kutaisi',
    name: 'Kutaisi',
    nameKa: 'ქუთაისი',
    center: { lat: 42.2679, lng: 42.6946 },
    districts: [
      { id: 'kutaisi-center', name: 'Center', nameKa: 'ცენტრი' },
      { id: 'kutaisi-balakhvani', name: 'Balakhvani', nameKa: 'ბალახვანი' },
      { id: 'kutaisi-ukimerioni', name: 'Ukimerioni', nameKa: 'უკიმერიონი' },
      { id: 'kutaisi-sulori', name: 'Sulori', nameKa: 'სულორი' },
      { id: 'kutaisi-gora', name: 'Gora', nameKa: 'გორა' },
    ],
  },
  {
    id: 'rustavi',
    name: 'Rustavi',
    nameKa: 'რუსთავი',
    center: { lat: 41.5489, lng: 44.9939 },
    districts: [
      { id: 'rustavi-center', name: 'Center', nameKa: 'ცენტრი' },
      { id: 'rustavi-1', name: 'Microraion 1', nameKa: 'მე-1 მიკრორაიონი' },
      { id: 'rustavi-2', name: 'Microraion 2', nameKa: 'მე-2 მიკრორაიონი' },
      { id: 'rustavi-3', name: 'Microraion 3', nameKa: 'მე-3 მიკრორაიონი' },
      { id: 'rustavi-shroma', name: 'Shroma', nameKa: 'შრომა' },
    ],
  },
  {
    id: 'gori',
    name: 'Gori',
    nameKa: 'გორი',
    center: { lat: 41.9816, lng: 44.1127 },
    districts: [
      { id: 'gori-center', name: 'Center', nameKa: 'ცენტრი' },
      { id: 'gori-kombinati', name: 'Kombinati', nameKa: 'კომბინატი' },
    ],
  },
  {
    id: 'zugdidi',
    name: 'Zugdidi',
    nameKa: 'ზუგდიდი',
    center: { lat: 42.5088, lng: 41.8709 },
    districts: [
      { id: 'zugdidi-center', name: 'Center', nameKa: 'ცენტრი' },
    ],
  },
  {
    id: 'poti',
    name: 'Poti',
    nameKa: 'ფოთი',
    center: { lat: 42.1461, lng: 41.6719 },
    districts: [
      { id: 'poti-center', name: 'Center', nameKa: 'ცენტრი' },
      { id: 'poti-port', name: 'Port Area', nameKa: 'პორტი' },
    ],
  },
  {
    id: 'telavi',
    name: 'Telavi',
    nameKa: 'თელავი',
    center: { lat: 41.9198, lng: 45.4731 },
    districts: [
      { id: 'telavi-center', name: 'Center', nameKa: 'ცენტრი' },
    ],
  },
  {
    id: 'akhaltsikhe',
    name: 'Akhaltsikhe',
    nameKa: 'ახალციხე',
    center: { lat: 41.6389, lng: 42.9828 },
    districts: [
      { id: 'akhaltsikhe-center', name: 'Center', nameKa: 'ცენტრი' },
      { id: 'akhaltsikhe-rabati', name: 'Rabati', nameKa: 'რაბათი' },
    ],
  },
  {
    id: 'marneuli',
    name: 'Marneuli',
    nameKa: 'მარნეული',
    center: { lat: 41.4706, lng: 44.8044 },
    districts: [
      { id: 'marneuli-center', name: 'Center', nameKa: 'ცენტრი' },
    ],
  },
  {
    id: 'senaki',
    name: 'Senaki',
    nameKa: 'სენაკი',
    center: { lat: 42.2694, lng: 42.0667 },
    districts: [
      { id: 'senaki-center', name: 'Center', nameKa: 'ცენტრი' },
    ],
  },
  {
    id: 'kobuleti',
    name: 'Kobuleti',
    nameKa: 'ქობულეთი',
    center: { lat: 41.8214, lng: 41.7767 },
    districts: [
      { id: 'kobuleti-center', name: 'Center', nameKa: 'ცენტრი' },
      { id: 'kobuleti-beach', name: 'Beach Area', nameKa: 'სანაპირო' },
    ],
  },
  {
    id: 'mtskheta',
    name: 'Mtskheta',
    nameKa: 'მცხეთა',
    center: { lat: 41.8453, lng: 44.7186 },
    districts: [
      { id: 'mtskheta-center', name: 'Center', nameKa: 'ცენტრი' },
    ],
  },
  {
    id: 'ozurgeti',
    name: 'Ozurgeti',
    nameKa: 'ოზურგეთი',
    center: { lat: 41.9231, lng: 42.0033 },
    districts: [
      { id: 'ozurgeti-center', name: 'Center', nameKa: 'ცენტრი' },
    ],
  },
  {
    id: 'kaspi',
    name: 'Kaspi',
    nameKa: 'კასპი',
    center: { lat: 41.9256, lng: 44.4261 },
    districts: [
      { id: 'kaspi-center', name: 'Center', nameKa: 'ცენტრი' },
    ],
  },
];

// Helper function to get region by ID
export const getRegionById = (regionId: string): Region | undefined => {
  return georgianRegions.find(r => r.id === regionId);
};

// Helper function to get district by ID within a region
export const getDistrictById = (regionId: string, districtId: string): District | undefined => {
  const region = getRegionById(regionId);
  return region?.districts.find(d => d.id === districtId);
};

