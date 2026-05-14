-- V51: Seed GPS coordinates for the first 50 accounts (Moroccan cities)
-- Updates accounts that have no GPS coordinates yet

WITH gps_data (rn, lat, lng, ville) AS (
  SELECT 1,  33.57314,  -7.58970, 'Casablanca - Centre'        UNION ALL
  SELECT 2,  34.02088,  -6.84165, 'Rabat - Agdal'              UNION ALL
  SELECT 3,  31.62952,  -7.98115, 'Marrakech - Guéliz'         UNION ALL
  SELECT 4,  34.01806,  -5.00786, 'Fès - Ville Nouvelle'       UNION ALL
  SELECT 5,  35.75952,  -5.83399, 'Tanger - Centre'            UNION ALL
  SELECT 6,  30.42784,  -9.59814, 'Agadir - Centre'            UNION ALL
  SELECT 7,  33.89352,  -5.54727, 'Meknès - Hamriyye'          UNION ALL
  SELECT 8,  34.68675,  -1.91148, 'Oujda - Centre'             UNION ALL
  SELECT 9,  34.26100,  -6.58022, 'Kénitra - Centre'           UNION ALL
  SELECT 10, 35.57852,  -5.36841, 'Tétouan - Centre'           UNION ALL
  SELECT 11, 34.05313,  -6.79861, 'Salé - Tabriquet'           UNION ALL
  SELECT 12, 35.17140,  -2.93353, 'Nador - Centre'             UNION ALL
  SELECT 13, 32.33730,  -6.34981, 'Béni Mellal - Centre'       UNION ALL
  SELECT 14, 33.23164,  -8.50071, 'El Jadida - Centre'         UNION ALL
  SELECT 15, 34.21001,  -3.99773, 'Taza - Centre'              UNION ALL
  SELECT 16, 33.68660,  -7.38304, 'Mohammedia - Centre'        UNION ALL
  SELECT 17, 33.00070,  -7.61960, 'Settat - Centre'            UNION ALL
  SELECT 18, 33.26560,  -7.58820, 'Berrechid - Centre'         UNION ALL
  SELECT 19, 32.88110,  -6.90630, 'Khouribga - Centre'         UNION ALL
  SELECT 20, 30.35810,  -9.53760, 'Inezgane - Souk'            UNION ALL
  SELECT 21, 35.19320,  -6.15590, 'Larache - Centre'           UNION ALL
  SELECT 22, 32.29940,  -9.23720, 'Safi - Port'                UNION ALL
  SELECT 23, 31.50850,  -9.75950, 'Essaouira - Médina'         UNION ALL
  SELECT 24, 35.25170,  -3.93720, 'Al Hoceima - Centre'        UNION ALL
  SELECT 25, 33.92690,  -6.90650, 'Témara - Centre'            UNION ALL
  SELECT 26, 33.85000,  -7.05000, 'Skhirat - Centre'           UNION ALL
  SELECT 27, 33.82360,  -6.06650, 'Khémisset - Centre'         UNION ALL
  SELECT 28, 34.22610,  -5.71220, 'Sidi Kacem - Centre'        UNION ALL
  SELECT 29, 34.92120,  -2.32010, 'Berkane - Centre'           UNION ALL
  SELECT 30, 34.40830,  -2.89530, 'Taourirt - Centre'          UNION ALL
  SELECT 31, 31.93140,  -4.42460, 'Errachidia - Centre'        UNION ALL
  SELECT 32, 29.69770,  -9.73190, 'Tiznit - Centre'            UNION ALL
  SELECT 33, 28.98700, -10.05740, 'Guelmim - Centre'           UNION ALL
  SELECT 34, 33.89720,  -6.30640, 'Tiflet - Centre'            UNION ALL
  SELECT 35, 33.52280,  -5.10720, 'Ifrane - Centre'            UNION ALL
  SELECT 36, 33.43330,  -5.21670, 'Azrou - Centre'             UNION ALL
  SELECT 37, 33.61860,  -7.50140, 'Ain Sebaâ - Zone Ind.'      UNION ALL
  SELECT 38, 33.45000,  -7.65000, 'Bouskoura - Centre'         UNION ALL
  SELECT 39, 33.79310,  -7.16140, 'Bouznika - Centre'          UNION ALL
  SELECT 40, 33.61670,  -7.11670, 'Benslimane - Centre'        UNION ALL
  SELECT 41, 33.45000,  -7.51670, 'Mediouna - Centre'          UNION ALL
  SELECT 42, 33.58330,  -7.55000, 'Aïn Harrouda - Centre'      UNION ALL
  SELECT 43, 33.51670,  -7.80000, 'Dar Bouazza - Centre'       UNION ALL
  SELECT 44, 33.58860,  -7.61140, 'Anfa - Casablanca'          UNION ALL
  SELECT 45, 33.57310,  -7.64000, 'Maârif - Casablanca'        UNION ALL
  SELECT 46, 33.56000,  -7.59000, 'Hay Moulay Rachid - Casa'   UNION ALL
  SELECT 47, 33.55000,  -7.62000, 'Lissasfa - Casablanca'      UNION ALL
  SELECT 48, 33.60000,  -7.53000, 'Sidi Moumen - Casablanca'   UNION ALL
  SELECT 49, 33.59500,  -7.49000, 'Ain Chock - Casablanca'     UNION ALL
  SELECT 50, 33.52500,  -7.67500, 'Nouaceur - Aéroport'
),
ranked_accounts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM accounts
  WHERE (latitude IS NULL OR longitude IS NULL)
)
UPDATE a
SET
  a.latitude  = g.lat,
  a.longitude = g.lng
FROM accounts a
INNER JOIN ranked_accounts r ON a.id = r.id
INNER JOIN gps_data        g ON r.rn = g.rn
WHERE r.rn <= 50;
