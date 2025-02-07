import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js"
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging.js"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3xFSfZMjEk2Ua1gXNZ-tgYqcQugS-EWc",
  authDomain: "celular-ab461.firebaseapp.com",
  projectId: "celular-ab461",
  storageBucket: "celular-ab461.firebasestorage.app",
  messagingSenderId: "140352356356",
  appId: "1:140352356356:web:878922578ffd406432f551",
  measurementId: "G-GJ8MJWCCPX",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const analytics = getAnalytics(app)
const messaging = getMessaging(app)

document.addEventListener("DOMContentLoaded", () => {
  const isAdminPage = window.location.pathname.includes("index.html")
  const isClientPage = window.location.pathname.includes("cliente.html")

  let services = []
  let barbers = []
  let schedules = []
  let appointments = []

  let selectedBarber = null
  let selectedService = null
  let selectedDate = null
  let selectedTime = null

  async function loadDataFromFirestore() {
    try {
      console.log("Loading data from Firestore...")
      const servicesSnapshot = await getDocs(collection(db, "services"))
      services = servicesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log("Services loaded:", services)

      const barbersSnapshot = await getDocs(collection(db, "barbers"))
      barbers = barbersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log("Barbers loaded:", barbers)

      const schedulesSnapshot = await getDocs(collection(db, "schedules"))
      schedules = schedulesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log("Schedules loaded:", schedules)

      const appointmentsSnapshot = await getDocs(collection(db, "appointments"))
      appointments = appointmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log("Appointments loaded:", appointments)

      if (isClientPage) {
        updateServiceList()
        updateBarberList()
        updateBarberSelection()
        updateServiceSelection()
      }
    } catch (error) {
      console.error("Error loading data from Firestore:", error)
    }
  }

  function setupAppointmentsListener() {
    const q = query(collection(db, "appointments"), orderBy("date"), orderBy("time"))
    onSnapshot(q, (snapshot) => {
      appointments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      if (isAdminPage) {
        renderAppointments()
      }
      if (isClientPage) {
        updateAvailableTimeSlots()
      }
    })
  }

  function setupAutomaticAppointmentCleanup() {
    setInterval(async () => {
      const now = new Date()
      const appointmentsToDelete = appointments.filter((appointment) => {
        const appointmentEnd = new Date(appointment.date + "T" + appointment.time)
        appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.serviceDuration)
        return appointmentEnd < now
      })

      for (const appointment of appointmentsToDelete) {
        await deleteFromFirestore("appointments", appointment.id)
      }

      // Actualizar la lista local de citas
      appointments = appointments.filter((appointment) => !appointmentsToDelete.includes(appointment))

      if (isAdminPage) {
        renderAppointments()
      }
    }, 60000) // Verificar cada minuto
  }

  async function updateFirestore(collectionName, data) {
    try {
      console.log(`Updating Firestore collection '${collectionName}' with data:`, data)
      let docRef
      if (data.id) {
        docRef = doc(db, collectionName, data.id)
        await updateDoc(docRef, data)
      } else {
        docRef = await addDoc(collection(db, collectionName), data)
      }
      console.log(`Document written with ID: ${docRef.id}`)
      await loadDataFromFirestore()
      return { success: true, message: "Datos guardados con éxito" }
    } catch (error) {
      console.error(`Error updating ${collectionName} in Firestore:`, error)
      return { success: false, message: `Error al guardar los datos: ${error.message}` }
    }
  }

  async function deleteFromFirestore(collectionName, id) {
    try {
      console.log(`Deleting document with ID ${id} from collection '${collectionName}'`)
      await deleteDoc(doc(db, collectionName, id))
      await loadDataFromFirestore()
    } catch (error) {
      console.error(`Error deleting from ${collectionName} in Firestore:`, error)
    }
  }

  function updateServiceList() {
    const serviceList = document.getElementById("service-list")
    if (!serviceList) return

    serviceList.innerHTML = ""
    services.forEach((service) => {
      const serviceCard = document.createElement("div")
      serviceCard.classList.add("service-card")
      serviceCard.innerHTML = `
        <h3>${service.name}</h3>
        <p>Precio: $${service.price}</p>
        <p>Duración: ${service.duration} minutos</p>
        ${service.description ? `<p>${service.description}</p>` : ""}
      `
      serviceList.appendChild(serviceCard)
    })
  }

  function updateBarberList() {
    const barberList = document.getElementById("barber-list")
    if (!barberList) return

    barberList.innerHTML = ""
    barbers.forEach((barber) => {
      const barberCard = document.createElement("div")
      barberCard.classList.add("barber-card")
      barberCard.innerHTML = `
        <img src="${barber.image}" alt="${barber.name}">
        <h3>${barber.name}</h3>
        <p>${barber.phone}</p>
      `
      barberList.appendChild(barberCard)
    })
  }

  function updateBarberSelection() {
    const barberSelection = document.getElementById("barber-selection")
    if (!barberSelection) return

    barberSelection.innerHTML = ""
    barbers.forEach((barber) => {
      const barberCard = document.createElement("div")
      barberCard.classList.add("barber-card")
      barberCard.dataset.id = barber.id
      barberCard.dataset.name = barber.name
      barberCard.innerHTML = `
        <img src="${barber.image}" alt="${barber.name}">
        <h3>${barber.name}</h3>
      `
      barberCard.addEventListener("click", () => {
        document.querySelectorAll("#barber-selection .barber-card").forEach((card) => card.classList.remove("selected"))
        barberCard.classList.add("selected")
        selectedBarber = barber
        document.getElementById("next-to-service").disabled = false
        updateServiceSelection()
      })
      barberSelection.appendChild(barberCard)
    })

    console.log("Barberos cargados:", barbers)
  }

  function updateServiceSelection() {
    const serviceSelection = document.getElementById("service-selection")
    if (!serviceSelection) return

    serviceSelection.innerHTML = ""

    if (services.length === 0) {
      serviceSelection.innerHTML = "<p>No hay servicios disponibles.</p>"
      return
    }

    services.forEach((service) => {
      const serviceCard = document.createElement("div")
      serviceCard.classList.add("service-card")
      serviceCard.dataset.id = service.id
      serviceCard.dataset.name = service.name
      serviceCard.dataset.duration = service.duration
      serviceCard.innerHTML = `
        <h3>${service.name}</h3>
        <p>$${service.price}</p>
        <p>${service.duration} minutos</p>
        <p>${service.description || ""}</p>
      `
      serviceCard.addEventListener("click", () => {
        document
          .querySelectorAll("#service-selection .service-card")
          .forEach((card) => card.classList.remove("selected"))
        serviceCard.classList.add("selected")
        selectedService = service
        document.getElementById("next-to-datetime").disabled = false
      })
      serviceSelection.appendChild(serviceCard)
    })

    console.log("Servicios mostrados:", services)
  }

  async function updateAvailableTimeSlots() {
    const dateSelect = document.getElementById("date-select")
    const timeSelect = document.getElementById("time-select")

    if (!selectedBarber || !selectedService || !dateSelect.value) {
      timeSelect.innerHTML = '<option value="">Seleccione fecha, barbero y servicio</option>'
      return
    }

    const barberId = selectedBarber.id
    const selectedDate = dateSelect.value
    const serviceDuration = selectedService.duration

    const barberSchedule = schedules.find((s) => s.barberId === barberId && !s.isBreak)
    if (!barberSchedule) {
      timeSelect.innerHTML = '<option value="">Barbero sin horario establecido</option>'
      return
    }

    const dayOfWeek = new Date(selectedDate).getDay()
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    if (!barberSchedule.workdays.includes(adjustedDayOfWeek)) {
      timeSelect.innerHTML = '<option value="">No disponible este día</option>'
      return
    }

    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("barberId", "==", barberId),
      where("date", "==", selectedDate),
    )
    const appointmentsSnapshot = await getDocs(appointmentsQuery)
    const dayAppointments = appointmentsSnapshot.docs.map((doc) => doc.data())

    const workStart = timeStringToMinutes(barberSchedule.start)
    const workEnd = timeStringToMinutes(barberSchedule.end)

    const breaks = schedules.filter((s) => s.barberId === barberId && s.isBreak && s.date === selectedDate)

    const availableSlots = []

    const now = new Date()
    const selectedDateTime = new Date(selectedDate)
    const isToday = selectedDateTime.toDateString() === now.toDateString()

    for (let time = workStart; time + serviceDuration <= workEnd; time += serviceDuration) {
      let slotIsAvailable = true
      const slotEnd = time + serviceDuration

      // Check if the slot has already passed for today
      if (isToday) {
        const slotTime = new Date(selectedDateTime)
        slotTime.setHours(Math.floor(time / 60), time % 60)
        if (slotTime <= now) {
          continue
        }
      }

      for (const break_ of breaks) {
        const breakStart = timeStringToMinutes(break_.start)
        const breakEnd = timeStringToMinutes(break_.end)

        if (time < breakEnd && slotEnd > breakStart) {
          slotIsAvailable = false
          break
        }
      }

      for (const appointment of dayAppointments) {
        const appointmentStart = timeStringToMinutes(appointment.time)
        const appointmentEnd = appointmentStart + appointment.serviceDuration

        if (time < appointmentEnd && slotEnd > appointmentStart) {
          slotIsAvailable = false
          break
        }
      }

      if (slotIsAvailable) {
        availableSlots.push(time)
      }
    }

    if (availableSlots.length === 0) {
      timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>'
    } else {
      timeSelect.innerHTML = availableSlots
        .map((minutes) => {
          const timeString = minutesToTimeString(minutes)
          return `<option value="${timeString}">${formatTime12Hour(timeString)}</option>`
        })
        .join("")
    }
  }

  function timeStringToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number)
    return hours * 60 + minutes
  }

  function minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  function formatTime12Hour(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  function setupBookingSteps() {
    const nextToService = document.getElementById("next-to-service")
    const nextToDatetime = document.getElementById("next-to-datetime")
    const nextToClientInfo = document.getElementById("next-to-client-info")
    const prevToBarber = document.getElementById("prev-to-barber")
    const prevToService = document.getElementById("prev-to-service")
    const prevToDatetime = document.getElementById("prev-to-datetime")
    const submitBooking = document.getElementById("submit-booking")

    nextToService.addEventListener("click", () => showBookingStep("step-service"))
    nextToDatetime.addEventListener("click", () => showBookingStep("step-datetime"))
    nextToClientInfo.addEventListener("click", () => showBookingStep("step-client-info"))
    prevToBarber.addEventListener("click", () => showBookingStep("step-barber"))
    prevToService.addEventListener("click", () => showBookingStep("step-service"))
    prevToDatetime.addEventListener("click", () => showBookingStep("step-datetime"))

    submitBooking.addEventListener("click", handleBookingSubmit)

    const dateSelect = document.getElementById("date-select")
    const timeSelect = document.getElementById("time-select")

    dateSelect.addEventListener("change", () => {
      selectedDate = dateSelect.value
      updateAvailableTimeSlots()
    })

    timeSelect.addEventListener("change", () => {
      selectedTime = timeSelect.value
      nextToClientInfo.disabled = !selectedTime
    })
  }

  function showBookingStep(stepId) {
    const steps = document.querySelectorAll(".booking-step")
    steps.forEach((step) => step.classList.remove("active"))
    document.getElementById(stepId).classList.add("active")
  }

  async function handleBookingSubmit() {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      alert("Por favor, complete todos los campos")
      return
    }

    const clientName = document.getElementById("client-name").value
    const clientPhone = document.getElementById("client-phone").value
    const clientEmail = document.getElementById("client-email").value

    if (!clientName || !clientPhone) {
      alert("Por favor, ingrese su nombre y número de teléfono")
      return
    }

    const appointment = {
      barberId: selectedBarber.id,
      barber: selectedBarber.name,
      serviceId: selectedService.id,
      service: selectedService.name,
      serviceDuration: selectedService.duration,
      date: selectedDate,
      time: selectedTime,
      clientName,
      clientPhone,
      clientEmail,
    }

    try {
      const docRef = await addDoc(collection(db, "appointments"), appointment)
      console.log("Cita guardada con ID: ", docRef.id)
      alert("Cita reservada con éxito")

      // Limpiar el formulario y reiniciar el proceso
      resetBookingForm()
      showBookingStep("step-barber")

      // Enviar notificación al administrador
      await sendNotificationToAdmin(appointment)
    } catch (error) {
      console.error("Error al guardar la cita:", error)
      alert("Hubo un error al reservar la cita. Por favor, intente nuevamente.")
    }
  }

  function resetBookingForm() {
    selectedBarber = null
    selectedService = null
    selectedDate = null
    selectedTime = null

    document.querySelectorAll(".barber-card, .service-card").forEach((card) => card.classList.remove("selected"))
    document.getElementById("date-select").value = ""
    document.getElementById("time-select").innerHTML = '<option value="">Selecciona una hora</option>'
    document.getElementById("client-name").value = ""
    document.getElementById("client-phone").value = ""
    document.getElementById("client-email").value = ""

    document.querySelectorAll(".next-step").forEach((button) => (button.disabled = true))
  }

  async function sendNotificationToAdmin(appointment) {
    try {
      const adminTokenDoc = await getDocs(collection(db, "adminTokens"))
      if (!adminTokenDoc.empty) {
        const adminToken = adminTokenDoc.docs[0].data().token
        const notificationPayload = {
          notification: {
            title: "Nueva cita reservada",
            body: `${appointment.clientName} ha reservado una cita para ${appointment.date} a las ${appointment.time}`,
          },
          to: adminToken,
        }

        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "key=YOUR_SERVER_KEY", // Reemplaza con tu clave de servidor FCM
          },
          body: JSON.stringify(notificationPayload),
        })

        if (response.ok) {
          console.log("Notificación enviada con éxito al administrador")
        } else {
          console.error("Error al enviar la notificación:", response.statusText)
        }
      } else {
        console.log("No se encontró el token del administrador")
      }
    } catch (error) {
      console.error("Error al enviar la notificación:", error)
    }
  }

  function showSection(sectionId) {
    const sections = document.querySelectorAll("main > section")
    sections.forEach((section) => section.classList.remove("active"))
    const sectionToShow = document.getElementById(sectionId)
    if (sectionToShow) {
      sectionToShow.classList.add("active")
    }
  }

  function showAdminAuth() {
    const adminAuthSection = document.getElementById("admin-auth")
    const adminPanel = document.getElementById("admin-panel")
    if (adminAuthSection && adminPanel) {
      adminAuthSection.style.display = "block"
      adminPanel.style.display = "none"
    }
  }

  function showAdminPanel() {
    const adminAuthSection = document.getElementById("admin-auth")
    const adminPanel = document.getElementById("admin-panel")
    if (adminAuthSection && adminPanel) {
      adminAuthSection.style.display = "none"
      adminPanel.style.display = "block"
    }
    renderAdminSection("appointments")
  }

  function renderAdminSection(sectionId) {
    const adminContent = document.getElementById("admin-content")
    if (!adminContent) return

    adminContent.innerHTML = ""
    switch (sectionId) {
      case "services":
        renderServiceManager()
        break
      case "barbers":
        renderBarberManager()
        break
      case "schedules":
        renderScheduleManager()
        break
      case "appointments":
        renderAppointments()
        break
    }
  }

  function renderServiceManager() {
    const form = document.createElement("form")
    form.classList.add("admin-form")
    form.innerHTML = `
    <input type="text" id="service-name" placeholder="Nombre del servicio" required>
    <input type="number" id="service-price" placeholder="Precio" required>
    <textarea id="service-description" placeholder="Descripción (opcional)"></textarea>
    <select id="service-duration" required>
      ${Array.from({ length: 12 }, (_, i) => (i + 1) * 5)
        .map((duration) => `<option value="${duration}">${duration} minutos</option>`)
        .join("")}
    </select>
    <button type="submit">Añadir Servicio</button>
  `
    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("service-name").value
      const price = document.getElementById("service-price").value
      const description = document.getElementById("service-description").value
      const duration = document.getElementById("service-duration").value
      const newService = {
        name,
        price: Number.parseFloat(price),
        description,
        duration: Number.parseInt(duration),
      }
      await updateFirestore("services", newService)
      form.reset()
      await loadDataFromFirestore()
      renderServiceList()
    })

    const adminContent = document.getElementById("admin-content")
    if (adminContent) {
      adminContent.innerHTML = ""
      adminContent.appendChild(form)
      renderServiceList()
    }
  }

  function renderServiceList() {
    const existingList = document.getElementById("service-admin-list")
    if (existingList) {
      existingList.remove()
    }
    const serviceList = document.createElement("ul")
    serviceList.id = "service-admin-list"
    serviceList.classList.add("admin-list")
    services.forEach((service) => {
      const li = document.createElement("li")
      li.textContent = `${service.name} - $${service.price} - ${service.duration} minutos`
      if (service.description) {
        li.textContent += ` - ${service.description}`
      }
      const deleteButton = document.createElement("button")
      deleteButton.textContent = "Eliminar"
      deleteButton.addEventListener("click", async () => {
        await deleteFromFirestore("services", service.id)
        await loadDataFromFirestore()
        renderServiceList()
      })
      li.appendChild(deleteButton)
      serviceList.appendChild(li)
    })
    const adminContent = document.getElementById("admin-content")
    if (adminContent) {
      adminContent.appendChild(serviceList)
    }
  }

  function renderBarberManager() {
    const form = document.createElement("form")
    form.classList.add("admin-form")
    form.innerHTML = `
      <input type="text" id="barber-name" placeholder="Nombre del barbero" required>
      <input type="tel" id="barber-phone" placeholder="Número de teléfono" required>
      <input type="file" id="barber-image" accept="image/*" required>
      <button type="submit">Añadir Barbero</button>
    `
    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("barber-name").value
      const phone = document.getElementById("barber-phone").value
      const imageFile = document.getElementById("barber-image").files[0]
      const reader = new FileReader()
      reader.onloadend = async () => {
        const newBarber = { name, phone, image: reader.result }
        await updateFirestore("barbers", newBarber)
        form.reset()
        await loadDataFromFirestore()
        renderBarberList()
      }
      reader.readAsDataURL(imageFile)
    })

    const adminContent = document.getElementById("admin-content")
    if (adminContent) {
      adminContent.appendChild(form)
      renderBarberList()
    }
  }

  function renderBarberList() {
    const existingList = document.getElementById("barber-admin-list")
    if (existingList) {
      existingList.remove()
    }
    const barberList = document.createElement("ul")
    barberList.id = "barber-admin-list"
    barberList.classList.add("admin-list")
    barbers.forEach((barber) => {
      const li = document.createElement("li")
      li.textContent = `${barber.name} - ${barber.phone}`
      const deleteButton = document.createElement("button")
      deleteButton.textContent = "Eliminar"
      deleteButton.addEventListener("click", async () => {
        await deleteFromFirestore("barbers", barber.id)
        await loadDataFromFirestore()
        renderBarberList()
      })
      li.appendChild(deleteButton)
      barberList.appendChild(li)
    })
    const adminContent = document.getElementById("admin-content")
    if (adminContent) {
      adminContent.appendChild(barberList)
    }
  }

  function renderScheduleManager() {
    const form = document.createElement("form")
    form.classList.add("admin-form")
    form.innerHTML = `
    <select id="schedule-barber" required>
      <option value="">Selecciona un barbero</option>
      ${barbers.map((barber) => `<option value="${barber.id}">${barber.name}</option>`).join("")}
    </select>
    <fieldset>
      <legend>Días de trabajo</legend>
      ${["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        .map(
          (day, index) => `
        <div>
          <input type="checkbox" id="day-${index}" name="workdays" value="${index}">
          <label for="day-${index}">${day}</label>
        </div>
      `,
        )
        .join("")}
    </fieldset>
    <label for="schedule-start">Hora de inicio:</label>
    <input type="time" id="schedule-start" required>
    <label for="schedule-end">Hora de fin:</label>
    <input type="time" id="schedule-end" required>
    <button type="submit">Establecer Horario</button>
    <h3>Añadir Descanso</h3>
    <label for="break-date">Fecha del descanso:</label>
    <input type="date" id="break-date" required>
    <label for="break-start">Hora de inicio del descanso:</label>
    <input type="time" id="break-start" required>
    <label for="break-end">Hora de fin del descanso:</label>
    <input type="time" id="break-end" required>
    <button type="button" id="add-break">Añadir Descanso</button>
  `

    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const barberId = document.getElementById("schedule-barber").value
      const workdays = Array.from(document.querySelectorAll('input[name="workdays"]:checked')).map((input) =>
        Number.parseInt(input.value),
      )
      const start = document.getElementById("schedule-start").value
      const end = document.getElementById("schedule-end").value
      const barber = barbers.find((b) => b.id === barberId)

      const schedule = {
        barberId,
        barberName: barber.name,
        workdays,
        start,
        end,
      }

      await updateFirestore("schedules", schedule)
      form.reset()
      await loadDataFromFirestore()
      renderScheduleList()
    })

    const addBreakButton = form.querySelector("#add-break")
    addBreakButton.addEventListener("click", async () => {
      const barberId = document.getElementById("schedule-barber").value
      const breakDate = document.getElementById("break-date").value
      const breakStart = document.getElementById("break-start").value
      const breakEnd = document.getElementById("break-end").value
      const barber = barbers.find((b) => b.id === barberId)

      const breakSchedule = {
        barberId,
        barberName: barber.name,
        date: breakDate,
        start: breakStart,
        end: breakEnd,
        isBreak: true,
      }

      await updateFirestore("schedules", breakSchedule)
      document.getElementById("break-date").value = ""
      document.getElementById("break-start").value = ""
      document.getElementById("break-end").value = ""
      await loadDataFromFirestore()
      renderScheduleList()
    })

    const adminContent = document.getElementById("admin-content")
    if (adminContent) {
      adminContent.innerHTML = ""
      adminContent.appendChild(form)
      renderScheduleList()
    }
  }

  function renderScheduleList() {
    const existingList = document.getElementById("schedule-admin-list")
    if (existingList) {
      existingList.remove()
    }
    const scheduleList = document.createElement("ul")
    scheduleList.id = "schedule-admin-list"
    scheduleList.classList.add("admin-list")

    schedules.forEach((schedule) => {
      const li = document.createElement("li")
      if (schedule.isBreak) {
        li.textContent = `Descanso: ${schedule.barberName} - (${schedule.date} ${schedule.start} - ${schedule.end})`
      } else {
        const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        const workdays = schedule.workdays.map((day) => days[day]).join(", ")
        li.textContent = `${schedule.barberName} - ${workdays} (${schedule.start} - ${schedule.end})`
      }
      const deleteButton = document.createElement("button")
      deleteButton.textContent = "Eliminar"
      deleteButton.addEventListener("click", async () => {
        await deleteFromFirestore("schedules", schedule.id)
        await loadDataFromFirestore()
        renderScheduleList()
      })
      li.appendChild(deleteButton)
      scheduleList.appendChild(li)
    })
    const adminContent = document.getElementById("admin-content")
    if (adminContent) {
      adminContent.appendChild(scheduleList)
    }
  }

  function renderAppointments() {
    const appointmentList = document.createElement("ul")
    appointmentList.classList.add("admin-list")

    const sortedAppointments = appointments.sort((a, b) => {
      const dateA = new Date(a.date + "T" + a.time)
      const dateB = new Date(b.date + "T" + b.time)
      return dateA - dateB
    })

    sortedAppointments.forEach((appointment) => {
      const li = document.createElement("li")
      li.textContent = `${appointment.date} - ${appointment.time} - ${appointment.barber} - ${appointment.service} - ${appointment.clientName}`
      const deleteButton = document.createElement("button")
      deleteButton.textContent = "Cancelar"
      deleteButton.classList.add("delete-appointment-btn")
      deleteButton.addEventListener("click", async () => {
        if (confirm("¿Estás seguro de que quieres cancelar esta cita?")) {
          await deleteFromFirestore("appointments", appointment.id)
        }
      })
      li.appendChild(deleteButton)
      appointmentList.appendChild(li)
    })

    const adminContent = document.getElementById("admin-content")
    if (adminContent) {
      adminContent.innerHTML = "<h2>Citas Reservadas</h2>"
      adminContent.appendChild(appointmentList)
    }
  }

  async function initializeMessaging() {
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: "BHfslCGZoJnSTGj3K8_x-Zc0QXnQZmbLOpejfDKIbo_SYneE7fvhH4cAAGRjFAjjku14U2dbtI4mLr6zoKl-Ocw",
        })
        console.log("Token FCM:", token)
        await updateFirestore("adminTokens", { token })

        onMessage(messaging, (payload) => {
          console.log("Mensaje recibido:", payload)
          const notificationTitle = payload.notification.title
          const notificationOptions = {
            body: payload.notification.body,
            icon: "/icon.png",
          }
          new Notification(notificationTitle, notificationOptions)
        })
      }
    } catch (error) {
      console.error("Error al inicializar FCM:", error)
    }
  }

  async function init() {
    console.log("Iniciando la aplicación...")
    await loadDataFromFirestore()
    setupAppointmentsListener()
    setupAutomaticAppointmentCleanup()
    console.log("Datos cargados:", { services, barbers, schedules, appointments })

    if (isClientPage) {
      showSection("home")
      updateBarberSelection()
      updateServiceSelection()
      setupBookingSteps()

      const dateSelect = document.getElementById("date-select")
      if (dateSelect) {
        const today = new Date().toISOString().split("T")[0]
        dateSelect.min = today
      }

      const mainBookingBtn = document.getElementById("main-booking-btn")
      if (mainBookingBtn) {
        mainBookingBtn.addEventListener("click", () => {
          showSection("booking")
          showBookingStep("step-barber")
        })
      }

      const navButtons = document.querySelectorAll("#nav-menu button")
      navButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const sectionId = button.id.replace("-btn", "")
          showSection(sectionId)
          if (sectionId === "booking") {
            showBookingStep("step-barber")
          }
        })
      })
    } else if (isAdminPage) {
      showAdminAuth()

      const adminAuthForm = document.getElementById("admin-auth-form")
      if (adminAuthForm) {
        adminAuthForm.addEventListener("submit", (e) => {
          e.preventDefault()
          const password = document.getElementById("admin-password").value
          if (password === "admin123") {
            showAdminPanel()
          } else {
            alert("Contraseña incorrecta")
          }
          adminAuthForm.reset()
        })
      }

      const adminNavButtons = document.querySelectorAll("#nav-menu button")
      adminNavButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const sectionId = button.id.replace("-btn", "")
          renderAdminSection(sectionId)
        })
      })

      await initializeMessaging()
    }

    console.log("Aplicación configurada")
  }

  init()
})


