import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import { supabaseClient } from "./db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jwt-simple";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { Heap } from "heap-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// console.log(__dirname);

const app = express();
app.use(
  cors({
    origin: [
      // "https://train-seat-booking-webapp-deployeds.onrender.com"
    ], // 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/hello", async (req, res) => {
  return res.status(200).json({ message: "Working" });
});
// User Sign up
app.post("/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const { data: existingUser, error: findError } = await supabaseClient
      .from("users")
      .select()
      .eq("username", username)
      .or(`email.eq.${email}`);

    if (findError) {
      return res.status(400).json({ error: "Error checking existing user" });
    }

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ error: "Username or Email already exists" });
    }
    const { data: newUserEntry, error } = await supabaseClient
      .from("users")
      .insert([{ username, email, password: hashedPassword }])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const jwtSecretKey = process.env.JWT_SECRET;

    const accessToken = jwt.encode(
      {
        userId: newUserEntry[0].id,
        username: newUserEntry[0].username,
        email: newUserEntry[0].email,
      },
      jwtSecretKey
    );
    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
    };

    return res.status(201).cookie("accessToken", accessToken, options).json({
      userId: newUserEntry.id,
      message: "Signup successful, you are logged in!",
    });
  } catch (error) {
    return res.status(400).json({ error: "Error Creating User" });
  }
});

//User Login
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      return res.status(400).json({ error: "Invalid Credential" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, data.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid Credential" });
    }
    const jwtSecretKey = process.env.JWT_SECRET;

    const accessToken = await jwt.encode({ userId: data.id }, jwtSecretKey);
    const options = {
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
    };

    const { data: loginUser, error: loginUserError } = await supabaseClient
      .from("users")
      .select("username,email,id")
      .eq("username", "testuser1")
      .single();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json({ userInfo: loginUser, accessToken });
  } catch (error) {
    res.status(400).json({ error: `Error Logging In , ${error.message}` });
  }
});

//Seats Availiblity
app.get("/seats", async (req, res) => {
  try {
    const { data, error } = await supabaseClient.from("seats").select("*");

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ error: "Error Fetching Seats Availiblity" });
  }
});

app.post("/seats/reserve", async (req, res) => {
  const { numberOfSeats } = req.body;
  const token = req.cookies?.accessToken;
  const jwtSecretKey = process.env.JWT_SECRET;
  // console.log("Cookie", req.cookies, "xxxx", token, "yy", jwtSecretKey);
  if (!Number.isInteger(numberOfSeats) || numberOfSeats < 1 || numberOfSeats > 7) {
    return res.status(400).json({ message: "You can only book between 1 and 7 seats." });
  }
  try {
    const decoded = await jwt.decode(token, jwtSecretKey);
    // console.log(decoded);
    if (!decoded?.userId) {
      return res.status(400).json({ error: "Unauthorized access" });
    }

    // Fetch unreserved seats
    const { data: seats, error: seatsError } = await supabaseClient
      .from("seats")
      .select("id, row, seat_number,is_reserved")
      .eq("is_reserved", false);

    if (seatsError) {
      return res.status(400).json({ error: "Error fetching seats data." });
    }

    const seatMatrix = transformSeatsToMatrix(seats);
    // console.log("SeatMatrix",seats,seatMatrix)
    // Use the bookSeats function to determine the best seat arrangement
    const bookingResult = bookSeats(seatMatrix, numberOfSeats);

    if (!bookingResult) {
      return res.status(400).json({ error: "Not enough seats available." });
    }

    const { seatIds, arrangement } = bookingResult;
    //console.log("Booking Logic",seatIds, arrangement)
    // Reserve seats in the database
    const reservationData = seatIds.map((id) => ({
      user_id: decoded.userId,
      seat_id: ((id.row-1) * 7) + (id.seat_number),
    }));
    //console.log(reservationData,"Conversion Success",seatIds)
    const seatIdsToUpdate = seatIds.map(({ row, seat_number }) => {
      // Calculate the seat_id using the provided formula
      return ((row - 1) * 7) + seat_number;
    });
    const { error: reservationError } = await supabaseClient
      .from("reservations")
      .upsert(reservationData);

    if (reservationError) {
      return res.status(400).json({ error: "Error creating reservation entry." });
    }

    await supabaseClient
      .from("seats")
      .update({ is_reserved: true, reserved_by: decoded.userId })
      .in("id", seatIdsToUpdate);
    const seatIdsToUpdateFormatted = seatIdsToUpdate.map((id) => ({ id }));

    
    return res.status(200).json({
      message: "Seats reserved successfully!",
      seats: seatIdsToUpdateFormatted,
      userId: decoded.userId,
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

function manhattan(seat1, seat2) {
  return Math.abs(seat1[0] - seat2[0]) + Math.abs(seat1[1] - seat2[1]);
}

// Function to book seats
function bookSeats(seats, numSeatsToBook) {
  const rows = seats.length;
  const cols = seats[0].length;
  //console.log("101")

  for (let row = 0; row < rows; row++) {
    for (let startCol = 0; startCol <= cols - numSeatsToBook; startCol++) {
      const canBook = Array.from({ length: numSeatsToBook }, (_, i) => seats[row][startCol + i] === 1).every(Boolean);
      
      if (canBook) {
        // //console.log(canBook,"can book",row,startCol)
        const seatIds = [];
        for (let i = 0; i < numSeatsToBook; i++) {
          seats[row][startCol + i] = 0;
          //console.log(row + 1,startCol + i + 1)
          seatIds.push({ row: row + 1, seat_number: startCol + i + 1});
        }
        // //console.log(seatIds,"These are booked")
        return { seatIds, arrangement: seatIds };
      }
    }
  }
  //console.log("102")
  let minCost = Infinity;
  let minSeatArrangement = null;
  let seatIds = [];
  //console.log(seats)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (seats[i][j] === 1) {
        const { cost, arrangement } = tryBookFrom(seats, i, j, numSeatsToBook);
        //console.log( cost, arrangement,i,j,numSeatsToBook)
        if (cost < minCost) {
          minCost = cost;
          minSeatArrangement = arrangement;
          seatIds = arrangement.map(([x, y]) => ({ row: x+1, seat_number: y+1 }));
        }
      }
    }
  }

  if (minSeatArrangement) {
    for (const [x, y] of minSeatArrangement) {
      seats[x][y] = 1;
    }
    return { seatIds, arrangement: minSeatArrangement };
  }
  //console.log("No Seat Founds")
  return null;  // Returning null to signify that no seats are available
}


function tryBookFrom(seats, startRow, startCol, numSeatsToBook) {
  const rows = seats.length;
  const cols = seats[0].length;
  let  totalCost = -1 
  const possibleSeats = [];
  const costHeap = []
  Heap.heapify(costHeap)//new Heap((a, b) => a.cost - b.cost);
  const selected = new Set();

  Heap.heappush(costHeap,[0,startRow,startCol ]);
  //console.log(103)
  const availableSeats = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (seats[i][j] === 1) {  // If the seat is available
        availableSeats.push([i, j]);
      }
    }
  }

  while (selected.size < numSeatsToBook && costHeap.length) {
      const [cost, x, y ] = Heap.heappop(costHeap);
      if (selected.has(`${x},${y}`)) continue;
      seats[x][y] = 0
      if(totalCost !== -1){
        totalCost += cost
      }
      else{
        totalCost = cost
      }
      selected.add(`${x},${y}`);
      possibleSeats.push([x, y]);

      for (const [nx, ny] of availableSeats) {
        if (!selected.has(`${nx},${ny}`)) {
          Heap.heappush(costHeap, [manhattan([x, y], [nx, ny]), nx, ny]);
        }
      }
    }

  if (selected.size === numSeatsToBook) {
      return  {
        cost: totalCost, // Return the total accumulated cost
        arrangement: possibleSeats
      };
  }

  return { cost: Infinity, arrangement: []};
}

function transformSeatsToMatrix(seats) {
  // Find the maximum row and seat_number to determine the matrix dimensions
  const maxRow = Math.max(...seats.map(seat => seat.row));
  const maxSeatNumber = Math.max(...seats.map(seat => seat.seat_number));

  // Initialize a matrix with all seats set to 0 (unreserved)
  const matrix = Array.from({ length: maxRow }, () => Array(maxSeatNumber).fill(0));

  // Fill the matrix with seat data
  seats.forEach(seat => {
    // Adjust for zero-based indexing by subtracting 1
    const rowIndex = seat.row - 1;
    const seatIndex = seat.seat_number - 1;

    if (rowIndex >= 0 && rowIndex < maxRow && seatIndex >= 0 && seatIndex < maxSeatNumber) {
      matrix[rowIndex][seatIndex] = seat.is_reserved ? 0 : 1;
    }
  });

  // console.log("Transformed Seat Matrix:", matrix); // Debugging output
  return matrix;
}



app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.use("*", (_, res) => {
  res.sendFile(path.join(__dirname, "/frontend/dist/index.html"));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
