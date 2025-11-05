/**
 * Danh sách tọa độ các quận/huyện ở Việt Nam
 * Dùng để hiển thị bản đồ khi station không có latitude/longitude trong database
 */

export interface DistrictCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Mock coordinates cho các quận/huyện ở các thành phố lớn Việt Nam
 * Bao gồm: TP.HCM, Hà Nội, Đà Nẵng, Cần Thơ
 */
export const DISTRICT_COORDINATES: Record<string, DistrictCoordinates> = {
  // TP. Hồ Chí Minh - Tất cả các quận
  'quan 1': { latitude: 10.7756, longitude: 106.7019 },
  'quận 1': { latitude: 10.7756, longitude: 106.7019 },
  'quan 2': { latitude: 10.7899, longitude: 106.7457 },
  'quận 2': { latitude: 10.7899, longitude: 106.7457 },
  'quan 3': { latitude: 10.7869, longitude: 106.6818 },
  'quận 3': { latitude: 10.7869, longitude: 106.6818 },
  'quan 4': { latitude: 10.7626, longitude: 106.7020 },
  'quận 4': { latitude: 10.7626, longitude: 106.7020 },
  'quan 5': { latitude: 10.7557, longitude: 106.6664 },
  'quận 5': { latitude: 10.7557, longitude: 106.6664 },
  'quan 6': { latitude: 10.7501, longitude: 106.6346 },
  'quận 6': { latitude: 10.7501, longitude: 106.6346 },
  'quan 7': { latitude: 10.7335, longitude: 106.7219 },
  'quận 7': { latitude: 10.7335, longitude: 106.7219 },
  'quan 8': { latitude: 10.7382, longitude: 106.6761 },
  'quận 8': { latitude: 10.7382, longitude: 106.6761 },
  'quan 9': { latitude: 10.8434, longitude: 106.8346 },
  'quận 9': { latitude: 10.8434, longitude: 106.8346 },
  'quan 10': { latitude: 10.7728, longitude: 106.6690 },
  'quận 10': { latitude: 10.7728, longitude: 106.6690 },
  'quan 11': { latitude: 10.7629, longitude: 106.6502 },
  'quận 11': { latitude: 10.7629, longitude: 106.6502 },
  'quan 12': { latitude: 10.8624, longitude: 106.6983 },
  'quận 12': { latitude: 10.8624, longitude: 106.6983 },
  'go vap': { latitude: 10.8389, longitude: 106.6666 },
  'gò vấp': { latitude: 10.8389, longitude: 106.6666 },
  'binh thanh': { latitude: 10.8142, longitude: 106.7011 },
  'bình thạnh': { latitude: 10.8142, longitude: 106.7011 },
  'tan binh': { latitude: 10.8006, longitude: 106.6525 },
  'tân bình': { latitude: 10.8006, longitude: 106.6525 },
  'tan phu': { latitude: 10.7940, longitude: 106.6256 },
  'tân phú': { latitude: 10.7940, longitude: 106.6256 },
  'phu nhuan': { latitude: 10.7990, longitude: 106.6825 },
  'phú nhuận': { latitude: 10.7990, longitude: 106.6825 },
  'binh tan': { latitude: 10.7940, longitude: 106.6024 },
  'bình tân': { latitude: 10.7940, longitude: 106.6024 },
  'thu duc': { latitude: 10.8505, longitude: 106.7718 },
  'thủ đức': { latitude: 10.8505, longitude: 106.7718 },
  'hoc mon': { latitude: 10.8852, longitude: 106.5926 },
  'hóc môn': { latitude: 10.8852, longitude: 106.5926 },
  'cu chi': { latitude: 10.9778, longitude: 106.4924 },
  'củ chi': { latitude: 10.9778, longitude: 106.4924 },
  'binh chanh': { latitude: 10.6978, longitude: 106.6142 },
  'bình chánh': { latitude: 10.6978, longitude: 106.6142 },
  'nha be': { latitude: 10.6954, longitude: 106.7534 },
  'nhà bè': { latitude: 10.6954, longitude: 106.7534 },
  'can gio': { latitude: 10.4129, longitude: 106.9613 },
  'cần giờ': { latitude: 10.4129, longitude: 106.9613 },
  
  // Hà Nội - Tất cả các quận
  'hoan kiem': { latitude: 21.0285, longitude: 105.8542 },
  'hoàn kiếm': { latitude: 21.0285, longitude: 105.8542 },
  'ba dinh': { latitude: 21.0342, longitude: 105.8195 },
  'ba đình': { latitude: 21.0342, longitude: 105.8195 },
  'dong da': { latitude: 21.0144, longitude: 105.8253 },
  'đống đa': { latitude: 21.0144, longitude: 105.8253 },
  'hai ba trung': { latitude: 21.0089, longitude: 105.8636 },
  'hai bà trưng': { latitude: 21.0089, longitude: 105.8636 },
  'cau giay': { latitude: 21.0333, longitude: 105.7940 },
  'cầu giấy': { latitude: 21.0333, longitude: 105.7940 },
  'tay ho': { latitude: 21.0649, longitude: 105.8194 },
  'tây hồ': { latitude: 21.0649, longitude: 105.8194 },
  'thanh xuan': { latitude: 20.9987, longitude: 105.8038 },
  'thanh xuân': { latitude: 20.9987, longitude: 105.8038 },
  'hoang mai': { latitude: 20.9689, longitude: 105.8519 },
  'hoàng mai': { latitude: 20.9689, longitude: 105.8519 },
  'long bien': { latitude: 21.0537, longitude: 105.8879 },
  'long biên': { latitude: 21.0537, longitude: 105.8879 },
  'ha dong': { latitude: 20.9720, longitude: 105.7739 },
  'hà đông': { latitude: 20.9720, longitude: 105.7739 },
  'nam tu liem': { latitude: 21.0047, longitude: 105.7516 },
  'nam từ liêm': { latitude: 21.0047, longitude: 105.7516 },
  'bac tu liem': { latitude: 21.0717, longitude: 105.7468 },
  'bắc từ liêm': { latitude: 21.0717, longitude: 105.7468 },
  
  // Đà Nẵng
  'hai chau': { latitude: 16.0471, longitude: 108.2068 },
  'hải châu': { latitude: 16.0471, longitude: 108.2068 },
  'thanh khe': { latitude: 16.0647, longitude: 108.1716 },
  'thanh khê': { latitude: 16.0647, longitude: 108.1716 },
  'son tra': { latitude: 16.0825, longitude: 108.2439 },
  'sơn trà': { latitude: 16.0825, longitude: 108.2439 },
  'ngu hanh son': { latitude: 16.0028, longitude: 108.2506 },
  'ngũ hành sơn': { latitude: 16.0028, longitude: 108.2506 },
  'lien chieu': { latitude: 16.0582, longitude: 108.1499 },
  'liên chiểu': { latitude: 16.0582, longitude: 108.1499 },
  'cam le': { latitude: 16.0275, longitude: 108.1767 },
  'cẩm lệ': { latitude: 16.0275, longitude: 108.1767 },
  'hoa vang': { latitude: 16.0078, longitude: 108.0695 },
  'hòa vang': { latitude: 16.0078, longitude: 108.0695 },
  
  // Cần Thơ
  'ninh kieu': { latitude: 10.0452, longitude: 105.7469 },
  'ninh kiều': { latitude: 10.0452, longitude: 105.7469 },
  'cai rang': { latitude: 10.0092, longitude: 105.7898 },
  'cái răng': { latitude: 10.0092, longitude: 105.7898 },
  'binh thuy': { latitude: 10.0858, longitude: 105.7626 },
  'bình thủy': { latitude: 10.0858, longitude: 105.7626 },
  'o mon': { latitude: 10.1192, longitude: 105.6241 },
  'ô môn': { latitude: 10.1192, longitude: 105.6241 },
  'thot not': { latitude: 10.2897, longitude: 105.5087 },
  'thốt nốt': { latitude: 10.2897, longitude: 105.5087 },
};

/**
 * Tìm tọa độ dựa trên tên quận/huyện trong text
 * @param searchText - Text cần tìm (có thể là tên trạm, địa chỉ, v.v.)
 * @returns Tọa độ nếu tìm thấy, null nếu không tìm thấy
 */
export function findDistrictCoordinates(searchText: string): DistrictCoordinates | null {
  const normalizedText = searchText.toLowerCase();
  
  for (const [district, coords] of Object.entries(DISTRICT_COORDINATES)) {
    if (normalizedText.includes(district)) {
      return coords;
    }
  }
  
  return null;
}

/**
 * Lấy tọa độ cho station, thêm offset nhỏ để tránh chồng lấn
 * @param station - Station object (có thể có latitude/longitude hoặc name/address/district/city)
 * @param index - Index để tạo offset khác nhau cho mỗi station
 * @param defaultCenter - Tọa độ mặc định nếu không tìm thấy quận (mặc định là TP.HCM)
 * @returns Tọa độ với offset nhỏ
 */
export function getStationCoordinates(
  station: {
    latitude?: number;
    longitude?: number;
    name?: string;
    address?: string;
    district?: string;
    city?: string;
  },
  index: number,
  defaultCenter: { latitude: number; longitude: number } = { latitude: 10.8231, longitude: 106.6297 }
): DistrictCoordinates {
  // Nếu station đã có coordinates, dùng luôn
  if (station.latitude && station.longitude) {
    return { latitude: station.latitude, longitude: station.longitude };
  }

  // Tìm kiếm trong tên, địa chỉ, quận, thành phố
  const searchText = `${station.name || ''} ${station.address || ''} ${station.district || ''} ${station.city || ''}`.toLowerCase();
  const districtCoords = findDistrictCoordinates(searchText);
  
  if (districtCoords) {
    // Thêm offset nhỏ để tránh chồng lấn marker
    return {
      latitude: districtCoords.latitude + (Math.random() - 0.5) * 0.01,
      longitude: districtCoords.longitude + (Math.random() - 0.5) * 0.01
    };
  }

  // Nếu không tìm thấy, dùng tọa độ mặc định với offset dựa trên index
  const offset = index * 0.02;
  return {
    latitude: defaultCenter.latitude + (offset % 0.1),
    longitude: defaultCenter.longitude + (Math.floor(offset / 0.1) * 0.02)
  };
}

