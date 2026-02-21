export interface Country {
  code: string;
  name: string;
}

export interface City {
  name: string;
  countryCode: string;
}

// Comprehensive country list
export const countries: Country[] = [
  { code: 'PK', name: 'Pakistan' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
];

// Cities organized by country code
export const citiesByCountry: Record<string, string[]> = {
  'PK': [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Sargodha', 'Bahawalpur', 'Sukkur', 'Larkana',
    'Sheikhupura', 'Jhang', 'Rahim Yar Khan', 'Gujrat', 'Kasur',
    'Mardan', 'Mingaora', 'Nawabshah', 'Chiniot', 'Kotri',
    'Khanpur', 'Hafizabad', 'Kohat', 'Jacobabad', 'Shikarpur',
    'Muzaffargarh', 'Khanewal', 'Gojra', 'Bahawalnagar', 'Abbottabad',
    'Muridke', 'Pakpattan', 'Chakwal', 'Gujar Khan', 'Okara'
  ],
  'US': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
    'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
    'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City',
    'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore'
  ],
  'GB': [
    'London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool',
    'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff',
    'Belfast', 'Leicester', 'Coventry', 'Newcastle', 'Nottingham',
    'Southampton', 'Derby', 'Portsmouth', 'Brighton', 'Reading'
  ],
  'CA': [
    'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton',
    'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener',
    'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor'
  ],
  'AU': [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide',
    'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong',
    'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Toowoomba'
  ],
  'AE': [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman',
    'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba'
  ],
  'SA': [
    'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam',
    'Khobar', 'Taif', 'Abha', 'Tabuk', 'Buraydah',
    'Khamis Mushait', 'Hail', 'Najran', 'Al Jubail', 'Yanbu'
  ],
  'IN': [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad',
    'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane'
  ],
  'BD': [
    'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet',
    'Barisal', 'Rangpur', 'Comilla', 'Narayanganj', 'Gazipur'
  ],
  'DE': [
    'Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt',
    'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'
  ],
  'FR': [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice',
    'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'
  ],
  'IT': [
    'Rome', 'Milan', 'Naples', 'Turin', 'Palermo',
    'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'
  ],
  'ES': [
    'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza',
    'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'
  ],
  'NL': [
    'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven',
    'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'
  ],
  'BE': [
    'Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège',
    'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst'
  ],
  'CH': [
    'Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne',
    'St. Gallen', 'Lucerne', 'Lugano', 'Biel', 'Thun'
  ],
  'AT': [
    'Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck',
    'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn'
  ],
  'SE': [
    'Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås',
    'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'
  ],
  'NO': [
    'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum',
    'Kristiansand', 'Fredrikstad', 'Tromsø', 'Sandnes', 'Asker'
  ],
  'DK': [
    'Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg',
    'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde'
  ],
  'FI': [
    'Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu',
    'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori'
  ],
  'PL': [
    'Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań',
    'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice'
  ],
  'CZ': [
    'Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec',
    'Olomouc', 'Ústí nad Labem', 'České Budějovice', 'Hradec Králové', 'Pardubice'
  ],
  'IE': [
    'Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford',
    'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Navan'
  ],
  'PT': [
    'Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga',
    'Funchal', 'Coimbra', 'Setúbal', 'Almada', 'Agualva-Cacém'
  ],
  'GR': [
    'Athens', 'Thessaloniki', 'Patras', 'Piraeus', 'Larissa',
    'Heraklion', 'Peristeri', 'Kallithea', 'Acharnes', 'Kalamaria'
  ],
  'TR': [
    'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya',
    'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakır'
  ],
  'RU': [
    'Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan',
    'Nizhny Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don'
  ],
  'CN': [
    'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu',
    'Hangzhou', 'Wuhan', 'Xi\'an', 'Nanjing', 'Tianjin'
  ],
  'JP': [
    'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo',
    'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama'
  ],
  'KR': [
    'Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon',
    'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang'
  ],
  'SG': [
    'Singapore'
  ],
  'MY': [
    'Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya',
    'Johor Bahru', 'Melaka', 'Kota Kinabalu', 'Kuching', 'Kota Bharu'
  ],
  'TH': [
    'Bangkok', 'Nonthaburi', 'Nakhon Ratchasima', 'Chiang Mai', 'Hat Yai',
    'Udon Thani', 'Pak Kret', 'Khon Kaen', 'Chaophraya Surasak', 'Nakhon Si Thammarat'
  ],
  'ID': [
    'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang',
    'Palembang', 'Makassar', 'Tangerang', 'Depok', 'Bekasi'
  ],
  'PH': [
    'Manila', 'Quezon City', 'Caloocan', 'Davao City', 'Cebu City',
    'Zamboanga City', 'Antipolo', 'Pasig', 'Taguig', 'Valenzuela'
  ],
  'VN': [
    'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Can Tho',
    'Bien Hoa', 'Hue', 'Nha Trang', 'Vung Tau', 'Quy Nhon'
  ],
  'NZ': [
    'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga',
    'Napier', 'Dunedin', 'Palmerston North', 'Nelson', 'Rotorua'
  ],
  'ZA': [
    'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth',
    'Bloemfontein', 'East London', 'Pietermaritzburg', 'Kimberley', 'Polokwane'
  ],
  'EG': [
    'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said',
    'Suez', 'Luxor', 'Asyut', 'Ismailia', 'Faiyum'
  ],
  'KE': [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
    'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega'
  ],
  'NG': [
    'Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt',
    'Benin City', 'Kaduna', 'Maiduguri', 'Zaria', 'Aba'
  ],
  'BR': [
    'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza',
    'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'
  ],
  'MX': [
    'Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana',
    'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí'
  ],
  'AR': [
    'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán',
    'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan'
  ],
  'CL': [
    'Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta',
    'Temuco', 'Rancagua', 'Talca', 'Arica', 'Iquique'
  ],
  'CO': [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Cúcuta', 'Soledad', 'Ibagué', 'Bucaramanga', 'Santa Marta'
  ],
};

// Search functions
export function searchCountries(query: string): Country[] {
  if (!query.trim()) return countries.slice(0, 20);
  
  const lowerQuery = query.toLowerCase();
  return countries.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.code.toLowerCase().includes(lowerQuery)
  ).slice(0, 20); // Limit results
}

export function searchCities(query: string, countryCode?: string): string[] {
  if (!query.trim()) {
    return countryCode ? (citiesByCountry[countryCode] || []).slice(0, 20) : [];
  }
  
  const lowerQuery = query.toLowerCase();
  
  if (countryCode) {
    return (citiesByCountry[countryCode] || [])
      .filter(c => c.toLowerCase().includes(lowerQuery))
      .slice(0, 20);
  }
  
  // Search across all cities
  return Object.values(citiesByCountry)
    .flat()
    .filter(c => c.toLowerCase().includes(lowerQuery))
    .slice(0, 20);
}

export function getCitiesByCountry(countryCode: string): string[] {
  return citiesByCountry[countryCode] || [];
}

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code);
}

export function getCountryName(code: string): string {
  const country = getCountryByCode(code);
  return country ? country.name : code;
}
