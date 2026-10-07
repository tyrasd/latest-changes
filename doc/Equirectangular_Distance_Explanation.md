
# Understanding the Equirectangular Approximation for Distance Calculation

This JavaScript function calculates the approximate distance between two points on the Earth's surface, given their latitude and longitude. It uses the **equirectangular approximation**, which is simpler and faster than more accurate formulas like the **Haversine formula**, but still sufficiently precise for short distances.

---

## JS Function
```js
function distance(λ1, φ1, λ2, φ2) {
    const R = 6371000;
    const Δλ = (λ2 - λ1) * Math.PI / 180;
    φ1 = φ1 * Math.PI / 180;
    φ2 = φ2 * Math.PI / 180;
    const x = Δλ * Math.cos((φ1 + φ2) / 2);
    const y = (φ2 - φ1);
    const d = Math.sqrt(x * x + y * y);
    return R * d;
};
```

## Key Concepts

### 1. **The Radius of the Earth (`R`)**

```js
const R = 6371000;
```
- The Earth's mean radius is approximately **6371 kilometers** or **6,371,000 meters**.
- In this function, distance is returned in meters because `R` is defined in meters.

---

### 2. **Converting Degrees to Radians**

```js
Δλ = (λ2 - λ1) * Math.PI / 180;
φ1 = φ1 * Math.PI / 180;
φ2 = φ2 * Math.PI / 180;
```
- Latitude (`φ`) and longitude (`λ`) are usually given in **degrees**, but trigonometric functions in JavaScript (and most programming languages) operate in **radians**.
- To convert degrees to radians, we multiply by `π / 180`.

---

### 3. **Why Use the Cosine Function for Longitude Differences?**

```js
const x = Δλ * Math.cos((φ1 + φ2) / 2);
```

- When calculating the distance between two points on a sphere, the distance covered by a change in **longitude** depends on the latitude.
- **Longitude lines** converge at the poles, so the distance between two points with the same longitude difference is smaller as you move closer to the poles.
- To account for this, the function multiplies the difference in longitude `Δλ` by the **cosine of the average latitude** `(φ1 + φ2) / 2`.
  - This ensures the longitudinal difference is scaled correctly according to the latitude.

> **Why cosine?**  
> - At the equator, `cos(0°) = 1`, so longitude differences correspond directly to distances.  
> - Moving towards the poles, `cos(90°) = 0`, meaning longitude differences have virtually no effect on distance, as longitude lines meet at the poles.

---

### 4. **Latitude Differences are Simpler**

```js
const y = (φ2 - φ1);
```
- **Latitude lines** are **parallel**, meaning the distance between degrees of latitude remains roughly constant regardless of where you are on Earth.
- Thus, the difference in latitude can be taken directly in radians, without any additional scaling.

---

### 5. **Calculating the Final Distance**

```js
const d = Math.sqrt(x * x + y * y);
return R * d;
```
- The function treats the small section of the Earth's surface between the two points as a flat triangle.
- It uses the **Pythagorean theorem** to combine the distances in the x (longitude) and y (latitude) directions.
- Finally, multiplying by `R` gives the actual distance on the Earth's surface.

---

## Summary

- **Latitude difference:** Direct subtraction in radians (latitude lines are parallel).
- **Longitude difference:** Scaled by `cos(latitude)` because longitude lines converge towards the poles.
- **Distance:** Calculated using the Pythagorean theorem and scaled by the Earth's radius.

This method offers a good trade-off between simplicity and accuracy for short distances, making it suitable for many applications in geospatial analysis.

## Credit

This formula has been found on the website [Movable Type](http://www.movable-type.co.uk/scripts/latlong.html#equirectangular). Thanks Chris Veness!