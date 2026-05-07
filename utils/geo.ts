/**
 * Haversine formula — returns distance in metres between two lat/lng points.
 */
export function haversineMeters(
lat1: number,
lng1: number,
lat2: number,
lng2: number,
):number{
    const R= 6_371_000
    const toRad= (deg: number)=> (deg * Math.PI) /180
    const dLat= toRad(lat2-lat1)
    const dLng= toRad(lng2-lng1)
    const a= Math.sin(dLat /2)**2 +
    Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))}

export async function geocodeAddress(
    address:string
):Promise<{lat: number; lng: number}|null>{
    if(!address?.trim()) return null
    try{
        const url= new URL('https://nominatim.openstreetmap.org/search')
        url.searchParams.set('format', 'json')
        url.searchParams.set('q', address.trim())
        url.searchParams.set('limit', '1')

        const res= await fetch(url.toString(), {
            headers:{
                'User-agent': 'LandscapingOpsApp/1.0 (contact@yourcompany.com)',
                Accept: 'application/json'
            },
            signal: AbortSignal.timeout(8_000)
        })

        if(!res.ok)return null
        const data: Array<{lat: string; lon: string}>= await res.json()
        if(!data[0]) return null

        return{
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
        }
    }catch{
        return null
    }
}