import React, { useState, useEffect } from "react";
import axios from "axios";

const Seats = () => {
  const [seats, setSeats] = useState([]);
  const [recentlyBookedSeats, setRecentlyBookedSeats] = useState([]);
  const [numSeatsToBook, setNumSeatsToBook] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/seats");
      setSeats(response.data.sort((a, b) => a.id - b.id)); // Ensure seats are sorted by ID
    } catch {
      setError("Failed to load seats.");
    }
  };

  const handleBooking = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/seats/reserve",
        { numberOfSeats: numSeatsToBook },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        setRecentlyBookedSeats(response.data.seats); // Seats successfully reserved
        setSuccess("Seats booked successfully!");
        fetchSeats(); // Refresh the seat data after booking
      } 
      // else {
      //   setError("Error booking seats. Please try again.");
      // }
    } catch (err) {
      console.log(err)
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // Show the error message from the backend
      } else {
        setError("Error booking seats. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecentlyBookedSeats([]);
    setError("");
    setSuccess("");
    setNumSeatsToBook(0);
  };

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
  };

  const seatGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 50px)",
    gap: "10px",
    marginBottom: "20px",
  };

  const seatStyle = {
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #ccc",
    borderRadius: "5px",
  };

  const reservedSeatStyle = {
    ...seatStyle,
    backgroundColor: "#ffcccc",
  };

  const availableSeatStyle = {
    ...seatStyle,
    backgroundColor: "#ccffcc",
  };

  const bookedSeatStyle = {
    ...seatStyle,
    backgroundColor: "#ccccff",
  };

  const inputStyle = {
    marginBottom: "10px",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  };

  const buttonStyle = {
    margin: "5px",
    padding: "10px 15px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
  };

  const spinnerStyle = {
    width: "20px",
    height: "20px",
    border: "2px solid #ccc",
    borderTop: "2px solid #007bff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  const errorStyle = {
    color: "red",
    marginTop: "10px",
  };

  const successStyle = {
    color: "green",
    marginTop: "10px",
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Ticket Booking</h1>

      <div style={seatGridStyle}>
        {seats.map((seat) => (
          <div
            key={seat.id}
            style={
              seat.is_reserved
                ? reservedSeatStyle
                : recentlyBookedSeats.some(
                    (bookedSeat) => bookedSeat.id === seat.id
                  )
                ? bookedSeatStyle
                : availableSeatStyle
            }
          >
            {seat.id}
          </div>
        ))}
      </div>

      {recentlyBookedSeats.length > 0 && (
        <div>
          <h3>Just Booked Seats:</h3>
          <div>
            {recentlyBookedSeats.map((seat) => (
              <button
                key={seat.id}
                style={{ ...buttonStyle, backgroundColor: "#ccccff" }}
              >
                Seat {seat.id}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <input
          type="number"
          min="1"
          max="7"
          value={numSeatsToBook}
          onChange={(e) => setNumSeatsToBook(Number(e.target.value))}
          placeholder="Number of Seats"
          style={inputStyle}
        />
        <button
          style={buttonStyle}
          onClick={handleBooking}
          disabled={loading || numSeatsToBook === 0}
        >
          {loading ? <div style={spinnerStyle}></div> : "Book"}
        </button>
        <button style={buttonStyle} onClick={handleReset}>
          Reset Booking
        </button>
      </div>

      {error && <p style={errorStyle}>{error}</p>}
      {success && <p style={successStyle}>{success}</p>}
    </div>
  );
};

export default Seats;
