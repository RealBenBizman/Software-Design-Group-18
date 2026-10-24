import { useEffect, useState } from "react";
import { studentQueueRequest } from "../utils/studentQueueApi";

export default function useStudentServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const data = await studentQueueRequest("/api/queue/services", { signal: controller.signal });
        if (!controller.signal.aborted) {
          setServices(data.services);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    const timer = setInterval(load, 5000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);

  return { services, loading, error };
}
