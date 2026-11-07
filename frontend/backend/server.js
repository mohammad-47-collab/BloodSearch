import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from the .env file.');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bloodsearch_db',
    port: Number(process.env.DB_PORT || 3306)
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        return;
    }

    console.log('MySQL connected successfully!');
});
// Verify JWT and identify the logged-in user
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Please log in to continue.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Your session is invalid or expired. Please log in again.'
        });
    }
}
// Admin authorization middleware
function requireAdmin(req, res, next) {
    const sql = 'SELECT role FROM users WHERE id = ?';

    db.query(sql, [req.userId], (err, results) => {
        if (err) {
            console.error('Admin authorization error:', err.message);
            return res.status(500).json({
                message: 'Unable to verify administrator access.'
            });
        }

        if (results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin permission required.'
            });
        }

        next();
    });
}
// Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Please enter your email and password.'
        });
    }

    const sql = `
    SELECT id, full_name, email, password_hash, blood_group
    FROM users
    WHERE email = ?
  `;

    db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
        if (err) {
            console.error('Login database error:', err.message);
            return res.status(500).json({
                message: 'Something went wrong. Please try again.'
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        try {
            const user = results[0];

            const isPasswordCorrect = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!isPasswordCorrect) {
                return res.status(401).json({
                    message: 'Invalid email or password.'
                });
            }

            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                message: 'Login successful!',
                token,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    bloodGroup: user.blood_group
                }
            });

        } catch (error) {
            console.error('Login error:', error.message);
            return res.status(500).json({
                message: 'An internal server error occurred.'
            });
        }
    });
});
// Admin Login API
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Please enter your email and password.'
        });
    }

    const sql = `
        SELECT id, full_name, email, password_hash, role
        FROM users
        WHERE email = ?
    `;

    db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
        if (err) {
            console.error('Admin login error:', err.message);
            return res.status(500).json({
                message: 'Something went wrong. Please try again.'
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        try {
            const user = results[0];

            const passwordCorrect = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!passwordCorrect) {
                return res.status(401).json({
                    message: 'Invalid email or password.'
                });
            }

            if (user.role !== 'admin') {
                return res.status(403).json({
                    message: 'Admin access only.'
                });
            }

            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                message: 'Admin login successful!',
                token,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Admin login error:', error.message);
            return res.status(500).json({
                message: 'An internal server error occurred.'
            });
        }
    });
});
app.get(
    '/api/admin/dashboard',
    authenticateToken,
    requireAdmin,
    (req, res) => {
        const sql = `
            SELECT
                COUNT(*) AS totalUsers,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS totalAdmins
            FROM users
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Dashboard error:', err.message);
                return res.status(500).json({
                    message: 'Unable to load dashboard statistics.'
                });
            }

            return res.json({
                message: 'Admin dashboard data loaded successfully.',
                statistics: results[0]
            });
        });
    }
);

// Test Route
app.get('/', (req, res) => {
    res.json({
        message: 'BloodSearch Backend is running successfully!'
    });
});

// Test Database Connection
app.get('/api/test-db', (req, res) => {
    db.query('SELECT 1 AS result', (err, results) => {
        if (err) {
            return res.status(500).json({
                message: 'Database query failed'
            });
        }

        res.json({
            message: 'Database connection is working!',
            result: results[0].result
        });
    });
});
// Get the logged-in user's profile
app.get('/api/profile', authenticateToken, (req, res) => {
    const sql = `
        SELECT
            id,
            full_name,
            email,
            phone,
            blood_group,
            date_of_birth,
            gender,
            address,
            weight,
            last_donation_date,
            available_to_donate,
            latitude,
            longitude
        FROM users
        WHERE id = ?
        LIMIT 1
    `;

    db.query(sql, [req.userId], (err, results) => {
        if (err) {
            console.error('Profile fetch error:', err.message);

            return res.status(500).json({
                message: 'Could not load your profile.'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: 'User profile not found.'
            });
        }

        const user = results[0];

        return res.status(200).json({
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.blood_group,
                dateOfBirth: user.date_of_birth,
                gender: user.gender,
                address: user.address,
                weight: user.weight,
                lastDonationDate: user.last_donation_date,
                availableToDonate: Boolean(user.available_to_donate),
                latitude: user.latitude,
                longitude: user.longitude
            }
        });
    });
});
// Update the logged-in user's profile
app.put('/api/profile', authenticateToken, (req, res) => {
    const {
        fullName,
        email,
        phone,
        bloodGroup,
        dateOfBirth,
        gender,
        address,
        weight,
        lastDonationDate,
        availableToDonate,
        latitude,
        longitude
    } = req.body;
    const hasLatitude =
        latitude !== null &&
        latitude !== undefined &&
        String(latitude).trim() !== '';

    const hasLongitude =
        longitude !== null &&
        longitude !== undefined &&
        String(longitude).trim() !== '';

    if (hasLatitude !== hasLongitude) {
        return res.status(400).json({
            message: 'Please provide both latitude and longitude.'
        });
    }

    if (hasLatitude && hasLongitude) {
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return res.status(400).json({
                message: 'Please provide valid location coordinates.'
            });
        }
    }



    // Required fields
    if (
        typeof fullName !== 'string' ||
        !fullName.trim() ||
        typeof email !== 'string' ||
        !email.trim() ||
        typeof phone !== 'string' ||
        !phone.trim() ||
        typeof bloodGroup !== 'string' ||
        !bloodGroup.trim() ||
        !dateOfBirth ||
        typeof address !== 'string' ||
        !address.trim()
    ) {
        return res.status(400).json({
            message: 'Please fill in all required fields.'
        });
    }

    // Validate email format
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
            message: 'Please enter a valid email address.'
        });
    }

    const normalizedPhone = phone.trim();

    // Validate blood group
    const allowedBloodGroups = [
        'A+', 'A-', 'B+', 'B-',
        'AB+', 'AB-', 'O+', 'O-'
    ];

    if (!allowedBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({
            message: 'Please select a valid blood group.'
        });
    }

    // Validate optional numeric values
    if (
        weight !== null &&
        weight !== undefined &&
        weight !== '' &&
        (!Number.isFinite(Number(weight)) || Number(weight) <= 0)
    ) {
        return res.status(400).json({
            message: 'Please enter a valid weight.'
        });
    }


    if (typeof availableToDonate !== 'boolean') {
        return res.status(400).json({
            message: 'Please select your donation availability.'
        });
    }

    // Check whether another user already uses this email or phone
    const checkSql = `
        SELECT id, email, phone
        FROM users
        WHERE (email = ? OR phone = ?)
          AND id <> ?
        LIMIT 1
    `;

    db.query(
        checkSql,
        [normalizedEmail, normalizedPhone, req.userId],
        (checkErr, results) => {
            if (checkErr) {
                console.error('Profile duplicate check error:', checkErr.message);

                return res.status(500).json({
                    message: 'Could not verify your email and phone number.'
                });
            }

            if (results.length > 0) {
                const existingUser = results[0];

                if (
                    existingUser.email.toLowerCase() === normalizedEmail
                ) {
                    return res.status(409).json({
                        message: 'This email is already used by another account.'
                    });
                }

                if (existingUser.phone === normalizedPhone) {
                    return res.status(409).json({
                        message: 'This phone number is already used by another account.'
                    });
                }
            }

            const updateSql = `
                UPDATE users
                SET
                    full_name = ?,
                    email = ?,
                    phone = ?,
                    blood_group = ?,
                    date_of_birth = ?,
                    gender = ?,
                    address = ?,
                    weight = ?,
                    last_donation_date = ?,
                    available_to_donate = ?,
                    latitude = ?,
                    longitude = ?
                WHERE id = ?
            `;

            const values = [
                fullName.trim(),
                normalizedEmail,
                normalizedPhone,
                bloodGroup,
                dateOfBirth,
                gender || null,
                address.trim(),
                weight === '' || weight === null || weight === undefined
                    ? null
                    : Number(weight),
                lastDonationDate || null,
                availableToDonate ? 1 : 0,
                Number(latitude),
                Number(longitude),
                req.userId
            ];

            db.query(updateSql, values, (updateErr, result) => {
                if (updateErr) {
                    console.error('Profile update error:', updateErr.message);

                    if (updateErr.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            message: 'This email or phone number is already registered.'
                        });
                    }

                    return res.status(500).json({
                        message: 'Profile update failed. Please try again.'
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: 'User profile not found.'
                    });
                }

                return res.status(200).json({
                    message: 'Profile updated successfully!',
                    user: {
                        id: req.userId,
                        fullName: fullName.trim(),
                        email: normalizedEmail,
                        phone: normalizedPhone,
                        bloodGroup,
                        dateOfBirth,
                        gender: gender || null,
                        address: address.trim(),
                        weight: weight === '' || weight === null ||
                            weight === undefined
                            ? null
                            : Number(weight),
                        lastDonationDate: lastDonationDate || null,
                        availableToDonate,
                        latitude: Number(latitude),
                        longitude: Number(longitude)
                    }
                });
            });
        }
    );
});

// Register a New User

app.post('/api/register', async (req, res) => {
    const {
        fullName,
        email,
        phone,
        password,
        bloodGroup,
        dateOfBirth,
        gender,
        address,
        weight,
        lastDonationDate,
        availableToDonate,
        latitude,
        longitude
    } = req.body;

    // Validate required fields
    if (
        !fullName ||
        !email ||
        !phone ||
        !password ||
        !bloodGroup ||
        !dateOfBirth ||
        !address
    ) {
        return res.status(400).json({
            message: 'Please provide all required fields.'
        });
    }
    if (
        latitude === undefined ||
        longitude === undefined ||
        latitude === null ||
        longitude === null ||
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude)) ||
        Number(latitude) < -90 ||
        Number(latitude) > 90 ||
        Number(longitude) < -180 ||
        Number(longitude) > 180
    ) {
        return res.status(400).json({
            message: 'Please provide a valid location.'
        });
    }

    if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
            message: 'Password must contain at least 8 characters.'
        });
    }

    // Normalize email and phone
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    try {
        // Check whether email or phone already exists
        const checkSql = `
            SELECT email, phone
            FROM users
            WHERE email = ? OR phone = ?
            LIMIT 1
        `;

        db.query(
            checkSql,
            [normalizedEmail, normalizedPhone],
            async (checkErr, results) => {
                if (checkErr) {
                    console.error(
                        'Registration duplicate check error:',
                        checkErr.message
                    );

                    return res.status(500).json({
                        message: 'Could not verify your email and phone number.'
                    });
                }

                if (results.length > 0) {
                    const existingUser = results[0];

                    if (
                        existingUser.email.toLowerCase() === normalizedEmail
                    ) {
                        return res.status(409).json({
                            message: 'This email is already registered.'
                        });
                    }

                    if (existingUser.phone === normalizedPhone) {
                        return res.status(409).json({
                            message: 'This phone number is already registered.'
                        });
                    }
                }

                try {
                    // Hash password before saving
                    const passwordHash = await bcrypt.hash(password, 10);

                    const sql = `
    INSERT INTO users (
        full_name,
        email,
        phone,
        password_hash,
        blood_group,
        date_of_birth,
        gender,
        address,
        weight,
        last_donation_date,
        available_to_donate,
        latitude,
        longitude
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

                    const values = [
                        fullName.trim(),
                        normalizedEmail,
                        normalizedPhone,
                        passwordHash,
                        bloodGroup,
                        dateOfBirth,
                        gender || null,
                        address.trim(),
                        weight ? Number(weight) : null,
                        lastDonationDate || null,
                        availableToDonate === false ? 0 : 1,
                        Number(latitude),
                        Number(longitude)
                    ];

                    db.query(sql, values, (err, result) => {
                        if (err) {
                            if (err.code === 'ER_DUP_ENTRY') {
                                return res.status(409).json({
                                    message: 'This email or phone number is already registered.'
                                });
                            }

                            console.error(
                                'Registration error:',
                                err.message
                            );

                            return res.status(500).json({
                                message: 'Registration failed. Please try again.'
                            });
                        }

                        return res.status(201).json({
                            message: 'Registration successful!',
                            user: {
                                id: result.insertId,
                                fullName: fullName.trim(),
                                email: normalizedEmail,
                                bloodGroup
                            }
                        });
                    });
                } catch (error) {
                    console.error(
                        'Password hashing error:',
                        error.message
                    );

                    return res.status(500).json({
                        message: 'An internal server error occurred.'
                    });
                }
            }
        );
    } catch (error) {
        console.error('Registration error:', error.message);

        return res.status(500).json({
            message: 'An internal server error occurred.'
        });
    }
});


// Get All Registered Users
app.get('/api/users', (req, res) => {
    db.query(
        `SELECT id, full_name, email, phone, blood_group,
                date_of_birth, gender, address, weight,
                last_donation_date, available_to_donate
         FROM users`,
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: 'Could not retrieve users'
                });
            }

            res.json(results);
        }
    );
});

app.get('/api/donors/search', (req, res) => {
    const bloodGroup = req.query.bloodGroup;
    const location = req.query.location;

    if (!bloodGroup || !location || !location.trim()) {
        return res.status(400).json({
            message: 'Please provide blood group and location.'
        });
    }

    const allowedBloodGroups = [
        'A+', 'A-', 'B+', 'B-',
        'AB+', 'AB-', 'O+', 'O-'
    ];

    if (!allowedBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({
            message: 'Invalid blood group.'
        });
    }

    const sql = `
        SELECT
            id,
            full_name,
            blood_group,
            address,
            phone
        FROM users
        WHERE blood_group = ?
          AND address LIKE ?
          AND available_to_donate = 1
          AND (
              last_donation_date IS NULL
              OR last_donation_date <= DATE_SUB(
                  CURDATE(), INTERVAL 3 MONTH
              )
          )
        ORDER BY full_name ASC
    `;

    db.query(
        sql,
        [bloodGroup, `%${location.trim()}%`],
        (err, results) => {
            if (err) {
                console.error(
                    'Donor search error:',
                    err.message
                );

                return res.status(500).json({
                    message: 'Could not search for donors.'
                });
            }

            // Remove duplicate records with the same database ID.
            const uniqueDonors = [
                ...new Map(
                    results.map(donor => [donor.id, donor])
                ).values()
            ];

            return res.status(200).json({
                count: uniqueDonors.length,
                donors: uniqueDonors
            });
        }
    );
});

// Start Server
app.listen(PORT, () => {
    console.log(`BloodSearch backend running at http://localhost:${PORT}`);
});
