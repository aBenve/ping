#!/bin/bash

# Copy google-services.json from EAS secret
if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "Copying google-services.json from secret..."
  cp "$GOOGLE_SERVICES_JSON" ./google-services.json
  echo "Done!"
else
  echo "Warning: GOOGLE_SERVICES_JSON secret not found"
fi
