const fetch = require('node-fetch');
const fs = require('fs');

async function loginAndAddServices() {
  // Login first
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: 'guilherme-varela@hotmail.com',
      password: 'adoado01'
    }),
  });

  if (!loginResponse.ok) {
    console.error('Login failed');
    return;
  }

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Login successful, cookies:', cookies);

  // List of sample services
  const services = [
    {
      clinicId: 2,
      name: "Botox Facial",
      description: "Aplicação de toxina botulínica para redução de rugas faciais.",
      category: "injectables",
      duration: 45,
      price: 45000, // R$ 450,00 (em centavos)
    },
    {
      clinicId: 2,
      name: "Preenchimento Labial",
      description: "Preenchimento dos lábios com ácido hialurônico.",
      category: "injectables",
      duration: 60,
      price: 80000, // R$ 800,00 (em centavos)
    },
    {
      clinicId: 2,
      name: "Limpeza de Pele Profunda",
      description: "Limpeza profunda com extração e máscara facial.",
      category: "facial",
      duration: 90,
      price: 18000, // R$ 180,00 (em centavos)
    },
    {
      clinicId: 2,
      name: "Drenagem Linfática",
      description: "Massagem terapêutica para redução de edemas e melhor circulação.",
      category: "massages",
      duration: 60,
      price: 15000, // R$ 150,00 (em centavos)
    },
    {
      clinicId: 2,
      name: "Peeling Químico",
      description: "Renovação celular com ácidos para melhorar a textura da pele.",
      category: "facial",
      duration: 45,
      price: 25000, // R$ 250,00 (em centavos)
    }
  ];

  console.log('Adding services...');
  
  // Add each service
  for (const service of services) {
    try {
      const response = await fetch('http://localhost:5000/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies,
        },
        body: JSON.stringify(service),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Service added: ${service.name}`);
      } else {
        console.error(`Failed to add service ${service.name}:`, await response.text());
      }
    } catch (error) {
      console.error(`Error adding service ${service.name}:`, error);
    }
  }
  
  console.log('Done adding services.');
}

loginAndAddServices().catch(console.error);
