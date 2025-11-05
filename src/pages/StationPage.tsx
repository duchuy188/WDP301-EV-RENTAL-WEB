import React, { useEffect, useState } from 'react';
import { stationAPI } from '../api/stationAPI';
import { Station } from '../types/station';
import { Button } from '../components/ui/button';
import StationMap from '../components/StationMap';
import { MapIcon, LayoutGrid } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const StationCard: React.FC<{ station: Station }> = ({ station }) => {
  return (
    <div className="transition-all duration-200 bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-100 hover:-translate-y-1 cursor-pointer group max-w-2xl mx-auto w-full">
      <div className="flex gap-4 p-4">
        {station.images && station.images.length ? (
          <img
            src={station.images[0]}
            alt={station.name}
            className="w-16 h-16 object-cover rounded-lg border border-gray-200 bg-gray-50 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-400 border border-dashed border-gray-300">
            Không có ảnh
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-800 group-hover:text-blue-700 truncate">{station.name}</h3>
          <p className="text-xs text-gray-500 mt-1 truncate">{station.address} — {station.district} — {station.city}</p>
          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${station.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {station.status === 'active' ? 'Đang hoạt động' : station.status === 'inactive' ? 'Không hoạt động' : station.status}
          </span>
        </div>
      </div>
      <div className="px-4 pb-4 text-xs text-gray-600 space-y-1">
        <div><span className="font-medium text-gray-700">Điện thoại:</span> {station.phone}</div>
        <div><span className="font-medium text-gray-700">Email:</span> {station.email}</div>
        <div><span className="font-medium text-gray-700">Mở cửa:</span> {station.opening_time} — <span className="font-medium">Đóng cửa:</span> {station.closing_time}</div>
        <div><span className="font-medium text-gray-700">Sức chứa:</span> <span className="text-blue-700 font-semibold">{station.current_vehicles}</span>/{station.max_capacity}</div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 6;

const StationPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  // Lọc
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  // View mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // When in map mode, load all stations (no pagination)
        // When in list mode, use pagination
        const res = await stationAPI.getStation({
          page: viewMode === 'map' ? undefined : page,
          limit: viewMode === 'map' ? 1000 : PAGE_SIZE,
          city: city || undefined,
          district: district || undefined,
          status: status || undefined,
          search: search || undefined,
        });
        if (!mounted) return;
        setStations(res.stations || []);
        setTotal(res.total || 0);
      } catch (err: any) {
        setError(err?.message || 'Failed to load stations');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [page, city, district, status, search, viewMode]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // UI cho thanh lọc
  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-blue-800 drop-shadow-sm">Tìm thấy {total} trạm</h1>
        {/* View mode toggle buttons */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Danh sách
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            className="flex items-center gap-2"
          >
            <MapIcon className="w-4 h-4" />
            Bản đồ
          </Button>
        </div>
      </div>
      {/* Thanh lọc */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center justify-between max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Tìm kiếm tên hoặc địa chỉ..."
          value={search}
          onChange={e => { setSearch(e.target.value); handleFilterChange(); }}
          className="border rounded px-3 py-2 text-sm w-48"
        />
        <input
          type="text"
          placeholder="Thành phố..."
          value={city}
          onChange={e => { setCity(e.target.value); handleFilterChange(); }}
          className="border rounded px-3 py-2 text-sm w-32"
        />
        <input
          type="text"
          placeholder="Quận/Huyện..."
          value={district}
          onChange={e => { setDistrict(e.target.value); handleFilterChange(); }}
          className="border rounded px-3 py-2 text-sm w-32"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); handleFilterChange(); }}
          className="border rounded px-3 py-2 text-sm w-32"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      </div>
      {loading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" text="Đang tải danh sách trạm..." />
        </div>
      )}
      {error && <div className="text-red-600 font-semibold">Lỗi: {error}</div>}
      {!loading && !error && (
        <>
          {viewMode === 'list' ? (
            <>
              <div className="flex flex-col gap-8">
                {stations.map(s => (
                  <StationCard key={s._id} station={s} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex flex-col items-center mt-10 mb-4 gap-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="min-w-[80px]"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Trước
                    </Button>
                    {/* Hiển thị các nút số trang */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        // Chỉ hiển thị tối đa 7 số trang quanh trang hiện tại
                        if (totalPages <= 7) return true;
                        if (page <= 4) return p <= 7;
                        if (page >= totalPages - 3) return p >= totalPages - 6;
                        return Math.abs(page - p) <= 3;
                      })
                      .map(p => (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="lg"
                          className={`min-w-[40px] px-2 ${p === page ? 'font-bold' : ''}`}
                          onClick={() => setPage(p)}
                          disabled={p === page}
                        >
                          {p}
                        </Button>
                      ))}
                    <Button
                      variant="outline"
                      size="lg"
                      className="min-w-[80px]"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                  <span className="text-base text-gray-700">Trang {page} / {totalPages}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-6">
              <StationMap 
                stations={stations} 
                searchLocation={district || city || ''}
              />
            </div>
          )}
        </>
      )}
      {!loading && !error && stations.length === 0 && (
        <div className="text-gray-500 text-center mt-10">Không tìm thấy trạm nào.</div>
      )}
    </div>
  );
};

export default StationPage;
