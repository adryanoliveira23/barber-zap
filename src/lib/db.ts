import { createClient } from "@/utils/supabase/client";

export interface Barbershop {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  instagram?: string;
  whatsapp?: string;
  address?: string;
}

export interface Service {
  id: string;
  barbershop_id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  active: boolean;
}

export interface Schedule {
  id: string;
  barbershop_id: string;
  user_id: string;
  weekly_hours: {
    [key: string]: { active: boolean; open: string; close: string };
  };
  interval_minutes: number;
  break_times: Array<{ start: string; end: string }>;
  blocked_dates: string[];
  whatsapp_config: {
    apiUrl: string;
    apiKey: string;
    instanceName: string;
    sendConfirmation: boolean;
    sendReminder24h: boolean;
    sendReminder2h: boolean;
  };
}

export interface Appointment {
  id: string;
  barbershop_id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  service_ids: string[];
  total_price: number;
  total_duration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  loyalty_applied: boolean;
  reminder_24h_sent?: boolean;
  reminder_2h_sent?: boolean;
  created_at?: string;
}

export interface Customer {
  id: string;
  barbershop_id: string;
  name: string;
  phone: string;
  visits_count: number;
  last_visit: string;
}

export interface Loyalty {
  id: string;
  barbershop_id: string;
  customer_phone: string;
  visits_count: number;
  progress: number;
}

const LOCAL_STORAGE_PREFIX = "barberzap_db_";

const getLocalData = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
};

const supabase = createClient();

interface SupabaseError {
  code?: string;
  message?: string;
}

const isTableMissingError = (error: SupabaseError): boolean => {
  if (!error) return false;
  // 42P01 = table does not exist, PGRST204 = column not found in schema cache
  return error.code === "42P01" || error.code === "PGRST204";
};

const isProduction = process.env.NODE_ENV === "production";

export async function getOrCreateBarbershop(userId: string, defaultName: string): Promise<Barbershop> {
  const defaultSlug = defaultName.toLowerCase().replace(/[^a-z0-9]/g, "-");

  try {
    const { data, error } = await supabase
      .from("barbershops")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) throw new Error("Fallback para local");
      console.error("Erro ao buscar barbearia:", error);
      throw error;
    }

    if (data) return data as Barbershop;

    const newBarber: Barbershop = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: defaultName,
      slug: defaultSlug,
      description: "Sua barbearia moderna com agendamento rápido.",
      address: "Rua das Barbearias, 123",
      whatsapp: "5511999999999",
      instagram: "barberzap",
    };

    const { data: created, error: createErr } = await supabase
      .from("barbershops")
      .insert(newBarber)
      .select()
      .single();

    if (createErr) throw createErr;
    return created as Barbershop;

  } catch (err) {
    let localShops = getLocalData<Barbershop[]>("barbershops") || [];
    let myShop = localShops.find(s => s.user_id === userId);

    if (!myShop) {
      myShop = {
        id: crypto.randomUUID(),
        user_id: userId,
        name: defaultName,
        slug: defaultSlug,
        description: "Sua barbearia moderna com agendamento rápido (Modo de Demonstração).",
        address: "Rua das Barbearias, 123",
      whatsapp: "556699762785",
        instagram: "barberzap",
      };
      localShops.push(myShop);
      setLocalData("barbershops", localShops);
    }
    return myShop;
  }
}

export async function updateBarbershop(shop: Barbershop): Promise<Barbershop> {
  try {
    const { data, error } = await supabase
      .from("barbershops")
      .update(shop)
      .eq("id", shop.id)
      .select()
      .single();

    if (error) throw error;
    return data as Barbershop;
  } catch (err) {
    let localShops = getLocalData<Barbershop[]>("barbershops") || [];
    localShops = localShops.map(s => s.id === shop.id ? shop : s);
    setLocalData("barbershops", localShops);
    return shop;
  }
}

export async function getBarbershopBySlug(slug: string): Promise<Barbershop | null> {
  try {
    const { data, error } = await supabase
      .from("barbershops")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as Barbershop;
  } catch (err) {
    const localShops = getLocalData<Barbershop[]>("barbershops") || [];
    const shop = localShops.find(s => s.slug === slug);
    if (shop) return shop;
  }

  if (!isProduction && slug === "barberzap") {
    return {
      id: "barberzap-mock-id",
      user_id: "barberzap-mock-owner",
      name: "BarberZap Classic",
      slug: "barberzap",
      description: "A barbearia conceito premium. Agende seu horário com os melhores profissionais.",
      address: "Av. Paulista, 1000 - São Paulo",
      whatsapp: "5511999999999",
      instagram: "barberzap_oficial",
    };
  }
  return null;
}

const DEFAULT_SERVICES = [
  { name: "Corte Social", price: 40, duration: 30, description: "Corte clássico na tesoura e máquina, acabamento impecável." },
  { name: "Corte Degradê", price: 50, duration: 40, description: "Degradê moderno com transições suaves e precisas." },
  { name: "Barba Completa", price: 35, duration: 30, description: "Toalha quente, navalha e hidratante premium." },
  { name: "Corte + Barba", price: 75, duration: 60, description: "Combo completo: corte + barba com toalha quente." },
  { name: "Sobrancelha", price: 15, duration: 15, description: "Design e alinhamento de sobrancelha na navalha." },
  { name: "Hidratação Capilar", price: 45, duration: 40, description: "Tratamento profundo com produtos importados." },
  { name: "Pigmentação", price: 30, duration: 30, description: "Alinhamento e disfarce de falhas na barba ou cabelo." },
  { name: "Luzes / Mechas", price: 80, duration: 60, description: "Mechas naturais ou platinadas. Consulte disponibilidade." },
];

export async function getServices(barbershopId: string): Promise<Service[]> {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as Service[];
  } catch (err) {
    let localServices = getLocalData<Service[]>("services") || [];
    let shopServices = localServices.filter(s => s.barbershop_id === barbershopId);

    if (shopServices.length === 0) {
      shopServices = DEFAULT_SERVICES.map(s => ({
        id: crypto.randomUUID(),
        barbershop_id: barbershopId,
        name: s.name,
        price: s.price,
        duration: s.duration,
        description: s.description,
        active: true,
      }));
      localServices.push(...shopServices);
      setLocalData("services", localServices);
    }
    return shopServices;
  }
}

export async function saveService(service: Omit<Service, "id"> & { id?: string }): Promise<Service> {
  const serviceId = service.id || crypto.randomUUID();
  const serviceWithId = { ...service, id: serviceId } as Service;

  try {
    const { data, error } = await supabase
      .from("services")
      .upsert(serviceWithId)
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  } catch (err) {
    let localServices = getLocalData<Service[]>("services") || [];
    if (localServices.find(s => s.id === serviceId)) {
      localServices = localServices.map(s => s.id === serviceId ? serviceWithId : s);
    } else {
      localServices.push(serviceWithId);
    }
    setLocalData("services", localServices);
    return serviceWithId;
  }
}

export async function deleteService(serviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (error) throw error;
    return true;
  } catch (err) {
    let localServices = getLocalData<Service[]>("services") || [];
    localServices = localServices.filter(s => s.id !== serviceId);
    setLocalData("services", localServices);
    return true;
  }
}

export async function getSchedule(barbershopId: string): Promise<Schedule> {
  const defaultSchedule: Omit<Schedule, "id" | "user_id"> = {
    barbershop_id: barbershopId,
    weekly_hours: {
      monday: { active: true, open: "09:00", close: "18:00" },
      tuesday: { active: true, open: "09:00", close: "18:00" },
      wednesday: { active: true, open: "09:00", close: "18:00" },
      thursday: { active: true, open: "09:00", close: "20:00" },
      friday: { active: true, open: "09:00", close: "20:00" },
      saturday: { active: true, open: "08:00", close: "17:00" },
      sunday: { active: false, open: "09:00", close: "12:00" },
    },
    interval_minutes: 30,
    break_times: [{ start: "12:00", end: "13:00" }],
    blocked_dates: [],
    whatsapp_config: {
      apiUrl: "",
      apiKey: "",
      instanceName: "",
      sendConfirmation: true,
      sendReminder24h: true,
      sendReminder2h: true,
    },
  };

  try {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as Schedule;

    const newSchedule = {
      ...defaultSchedule,
      id: crypto.randomUUID(),
      user_id: "default-user",
    } as Schedule;

    const { data: created, error: createErr } = await supabase
      .from("schedules")
      .insert(newSchedule)
      .select()
      .single();

    if (createErr) throw createErr;
    return created as Schedule;
  } catch (err) {
    let localSchedules = getLocalData<Schedule[]>("schedules") || [];
    let mySched = localSchedules.find(s => s.barbershop_id === barbershopId);
    if (!mySched) {
      mySched = {
        ...defaultSchedule,
        id: crypto.randomUUID(),
        user_id: "local-user",
      } as Schedule;
      localSchedules.push(mySched);
      setLocalData("schedules", localSchedules);
    }
    return mySched;
  }
}

export async function saveSchedule(schedule: Schedule): Promise<Schedule> {
  try {
    const { data, error } = await supabase
      .from("schedules")
      .upsert(schedule)
      .select()
      .single();

    if (error) throw error;
    return data as Schedule;
  } catch (err) {
    let localSchedules = getLocalData<Schedule[]>("schedules") || [];
    localSchedules = localSchedules.map(s => s.id === schedule.id ? schedule : s);
    setLocalData("schedules", localSchedules);
    return schedule;
  }
}

export async function getAppointments(barbershopId: string): Promise<Appointment[]> {
  const normalizeAppointment = (appt: any): Appointment => ({
    ...appt,
    // Normalize service_ids: DB may return UUID[] (native array) or JSONB array
    service_ids: Array.isArray(appt.service_ids)
      ? appt.service_ids.map(String)
      : [],
    total_duration: Number(appt.total_duration) || 30,
    total_price: Number(appt.total_price) || 0,
  });

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) throw error;
    return (data || []).map(normalizeAppointment);
  } catch (err) {
    // Fallback: retorna local storage sem dados mock
    const localAppts = getLocalData<Appointment[]>("appointments") || [];
    return localAppts.filter(a => a.barbershop_id === barbershopId).map(normalizeAppointment);
  }
}

export async function createAppointment(appt: Omit<Appointment, "id" | "status" | "loyalty_applied">): Promise<Appointment> {
  const newAppt: Appointment = {
    ...appt,
    id: crypto.randomUUID(),
    status: "pending",
    loyalty_applied: false,
    reminder_24h_sent: false,
    reminder_2h_sent: false,
    created_at: new Date().toISOString(),
  };

  const triggerConfirmationMsg = async (appointment: Appointment) => {
    try {
      const schedule = await getSchedule(appointment.barbershop_id);
      if (schedule && schedule.whatsapp_config?.sendConfirmation) {
        const { apiUrl, apiKey, instanceName } = schedule.whatsapp_config;
        if (apiUrl && apiKey && instanceName) {
          const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const confirmUrl = `${origin}/api/confirm?id=${appointment.id}`;
          const shop = await getBarbershop(appointment.barbershop_id);
          const shopName = shop?.name || "Barbearia";
          const dateStr = new Date(appointment.date + "T00:00:00").toLocaleDateString("pt-BR");
          const msg = `Olá, ${appointment.customer_name}! Seu agendamento na ${shopName} foi reservado para o dia ${dateStr} às ${appointment.time}.\n\nPara confirmar seu horário, por favor clique no link abaixo:\n${confirmUrl}`;

          await fetch("/api/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiUrl,
              apiKey,
              instanceName,
              to: appointment.customer_phone,
              message: msg
            })
          });
        }
      }
    } catch (e) {
      console.error("Erro ao enviar confirmação de WhatsApp:", e);
    }
  };

  try {
    const { data, error } = await supabase
      .from("appointments")
      .insert(newAppt)
      .select()
      .single();

    if (error) throw error;

    // Fire-and-forget: CRM update and WhatsApp confirmation don't block the response
    updateCRMAndLoyalty(newAppt).catch(e => console.error("CRM update error:", e));
    triggerConfirmationMsg(newAppt);

    return data as Appointment;
  } catch (err) {
    let localAppts = getLocalData<Appointment[]>("appointments") || [];
    localAppts.push(newAppt);
    setLocalData("appointments", localAppts);

    // Fire-and-forget in fallback too
    updateCRMAndLoyaltyLocal(newAppt).catch(e => console.error("Local CRM update error:", e));
    triggerConfirmationMsg(newAppt);

    return newAppt;
  }
}

export async function deleteAppointment(apptId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", apptId);

    if (error) throw error;

    let localAppts = getLocalData<Appointment[]>("appointments") || [];
    localAppts = localAppts.filter(a => a.id !== apptId);
    setLocalData("appointments", localAppts);

    return true;
  } catch (err) {
    console.error("Erro ao deletar agendamento:", err);
    return false;
  }
}
export async function updateAppointmentStatus(
  apptId: string,
  status: Appointment["status"]
): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", apptId)
      .select()
      .single();

    if (error) throw error;

    if (data && status === "completed") {
      await incrementLoyaltyAndCRM(data as Appointment);
    }

    return data as Appointment;
  } catch (err) {
    let localAppts = getLocalData<Appointment[]>("appointments") || [];
    const appt = localAppts.find(a => a.id === apptId);

    if (appt) {
      appt.status = status;
      setLocalData("appointments", localAppts);

      if (status === "completed") {
        await incrementLoyaltyAndCRMLocal(appt);
      }
      return appt;
    }
    return null;
  }
}

async function updateCRMAndLoyalty(appt: Appointment) {
  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("barbershop_id", appt.barbershop_id)
      .eq("phone", appt.customer_phone)
      .maybeSingle();

    if (!customer) {
      await supabase.from("customers").insert({
        barbershop_id: appt.barbershop_id,
        name: appt.customer_name,
        phone: appt.customer_phone,
        visits_count: 0,
        last_visit: new Date().toISOString(),
      });
    }

    const { data: loyalty } = await supabase
      .from("loyalty")
      .select("*")
      .eq("barbershop_id", appt.barbershop_id)
      .eq("customer_phone", appt.customer_phone)
      .maybeSingle();

    if (!loyalty) {
      await supabase.from("loyalty").insert({
        barbershop_id: appt.barbershop_id,
        customer_phone: appt.customer_phone,
        visits_count: 0,
        progress: 0,
      });
    }
  } catch (e) {
    console.error("Falha ao registrar CRM/Loyalty no Supabase:", e);
  }
}

async function updateCRMAndLoyaltyLocal(appt: Appointment) {
  let localCRM = getLocalData<Customer[]>("customers") || [];
  let customer = localCRM.find(c => c.barbershop_id === appt.barbershop_id && c.phone === appt.customer_phone);

  if (!customer) {
    customer = {
      id: crypto.randomUUID(),
      barbershop_id: appt.barbershop_id,
      name: appt.customer_name,
      phone: appt.customer_phone,
      visits_count: 0,
      last_visit: new Date().toISOString(),
    };
    localCRM.push(customer);
    setLocalData("customers", localCRM);
  }

  let localLoyalty = getLocalData<Loyalty[]>("loyalty") || [];
  let loyalty = localLoyalty.find(l => l.barbershop_id === appt.barbershop_id && l.customer_phone === appt.customer_phone);

  if (!loyalty) {
    loyalty = {
      id: crypto.randomUUID(),
      barbershop_id: appt.barbershop_id,
      customer_phone: appt.customer_phone,
      visits_count: 0,
      progress: 0,
    };
    localLoyalty.push(loyalty);
    setLocalData("loyalty", localLoyalty);
  }
}

async function incrementLoyaltyAndCRM(appt: Appointment) {
  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("barbershop_id", appt.barbershop_id)
      .eq("phone", appt.customer_phone)
      .single();

    if (customer) {
      await supabase
        .from("customers")
        .update({
          visits_count: customer.visits_count + 1,
          last_visit: new Date().toISOString(),
        })
        .eq("id", customer.id);
    }

    const { data: loyalty } = await supabase
      .from("loyalty")
      .select("*")
      .eq("barbershop_id", appt.barbershop_id)
      .eq("customer_phone", appt.customer_phone)
      .single();

    if (loyalty) {
      let newProgress = loyalty.progress + 1;
      if (newProgress > 10) newProgress = 10;

      await supabase
        .from("loyalty")
        .update({
          visits_count: loyalty.visits_count + 1,
          progress: newProgress,
        })
        .eq("id", loyalty.id);
    }
  } catch (e) {
    console.error("Falha ao incrementar fidelidade/CRM:", e);
  }
}

async function incrementLoyaltyAndCRMLocal(appt: Appointment) {
  let localCRM = getLocalData<Customer[]>("customers") || [];
  localCRM = localCRM.map(c => {
    if (c.barbershop_id === appt.barbershop_id && c.phone === appt.customer_phone) {
      return {
        ...c,
        visits_count: c.visits_count + 1,
        last_visit: new Date().toISOString(),
      };
    }
    return c;
  });
  setLocalData("customers", localCRM);

  let localLoyalty = getLocalData<Loyalty[]>("loyalty") || [];
  localLoyalty = localLoyalty.map(l => {
    if (l.barbershop_id === appt.barbershop_id && l.customer_phone === appt.customer_phone) {
      let newProgress = l.progress + 1;
      if (newProgress > 10) newProgress = 10;
      return {
        ...l,
        visits_count: l.visits_count + 1,
        progress: newProgress,
      };
    }
    return l;
  });
  setLocalData("loyalty", localLoyalty);
}

export async function getCustomers(barbershopId: string): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("visits_count", { ascending: false });

    if (error) throw error;
    return data as Customer[];
  } catch (err) {
    // Fallback: retorna local storage sem dados mock
    const localCRM = getLocalData<Customer[]>("customers") || [];
    return localCRM.filter(c => c.barbershop_id === barbershopId);
  }
}

export async function getLoyaltyStatus(barbershopId: string, phone: string): Promise<Loyalty | null> {
  try {
    const { data, error } = await supabase
      .from("loyalty")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("customer_phone", phone)
      .maybeSingle();

    if (error) throw error;
    return data as Loyalty;
  } catch (err) {
    const localLoyalty = getLocalData<Loyalty[]>("loyalty") || [];
    const entry = localLoyalty.find(l => l.barbershop_id === barbershopId && l.customer_phone === phone);

    if (entry) return entry;

    if (!isProduction) {
      if (phone === "11988888888") {
        return { id: "mock-loy-1", barbershop_id: barbershopId, customer_phone: phone, visits_count: 5, progress: 5 };
      }
      if (phone === "11977777777") {
        return { id: "mock-loy-2", barbershop_id: barbershopId, customer_phone: phone, visits_count: 12, progress: 2 };
      }
    }
    return null;
  }
}

export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (error) throw error;
    return data as Appointment;
  } catch (err) {
    const localAppts = getLocalData<Appointment[]>("appointments") || [];
    return localAppts.find(a => a.id === appointmentId) || null;
  }
}

export async function getBarbershop(barbershopId: string): Promise<Barbershop | null> {
  try {
    const { data, error } = await supabase
      .from("barbershops")
      .select("*")
      .eq("id", barbershopId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as Barbershop;
  } catch (err) {
    const localShops = getLocalData<Barbershop[]>("barbershops") || [];
    const shop = localShops.find(s => s.id === barbershopId || s.slug === barbershopId);
    if (shop) return shop;
  }
  return null;
}

export async function resetLoyaltyProgress(loyaltyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("loyalty")
      .update({ progress: 0, updated_at: new Date().toISOString() })
      .eq("id", loyaltyId);

    if (error) throw error;
    return true;
  } catch (err) {
    let localLoyalty = getLocalData<Loyalty[]>("loyalty") || [];
    localLoyalty = localLoyalty.map(l => l.id === loyaltyId ? { ...l, progress: 0 } : l);
    setLocalData("loyalty", localLoyalty);
    return true;
  }
}

export async function updateAppointmentReminders(
  appointmentId: string,
  reminders: { reminder_24h_sent?: boolean; reminder_2h_sent?: boolean }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("appointments")
      .update({ ...reminders, updated_at: new Date().toISOString() })
      .eq("id", appointmentId);

    if (error) throw error;
    return true;
  } catch (err) {
    let localAppts = getLocalData<Appointment[]>("appointments") || [];
    localAppts = localAppts.map(a => a.id === appointmentId ? { ...a, ...reminders } : a);
    setLocalData("appointments", localAppts);
    return true;
  }
}

export async function getAllUpcomingAppointments(): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .in("status", ["pending", "confirmed"]);

    if (error) throw error;
    return data as Appointment[];
  } catch (err) {
    const localAppts = getLocalData<Appointment[]>("appointments") || [];
    return localAppts.filter((a) => ["pending", "confirmed"].includes(a.status));
  }
}
