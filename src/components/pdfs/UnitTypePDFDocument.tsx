import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';

// Register the Roboto font
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.ttf' },
        { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-900-normal.ttf', fontWeight: 'bold' },
    ],
});

Font.registerEmojiSource({
    format: 'png',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/',
});

// Define styles for the PDF document
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 12,
        fontFamily: 'Roboto', // Updated font family
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: 'Roboto', // Updated font family
    },
    subtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#666',
        fontFamily: 'Roboto', // Updated font family
    },
    section: {
        marginVertical: 20,
    },
    imageGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        gap: 10,
    },
    image: {
        width: '48%',
        objectFit: 'cover',
        borderRadius: 5,
    },
    floorPlanImage: {
        width: '100%',
        objectFit: 'contain',
        borderRadius: 5,
        marginTop: 10,
    },
    text: {
        fontSize: 12,
        marginVertical: 5,
        fontFamily: 'Roboto', // Updated font family
    },
    address: {
        fontSize: 12,
        color: '#555',
        fontFamily: 'Roboto', // Updated font family
    },
    grid: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    gridItem: {
        width: '48%',
        fontSize: 12,
        marginBottom: 5,
        fontFamily: 'Roboto', // Updated font family
    },
});

// Define styles for AgentInformation
const agentStyles = StyleSheet.create({
    container: {
        marginTop: 20,
        padding: 10,
        border: '1px solid #ddd',
        borderRadius: 5,
    },
    header: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: 'Roboto', // Updated font family
    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    text: {
        fontSize: 12,
        marginVertical: 4,
        fontFamily: 'Roboto', // Updated font family
    },
});

// Define a constant object for icon URLs
const ICONS = {
    marker: "https://img.icons8.com/ios-filled/50/000000/marker.png",
    money: "https://img.icons8.com/ios-filled/50/000000/money.png",
    building: "https://img.icons8.com/ios-filled/50/000000/building.png",
    resize: "https://img.icons8.com/ios-filled/50/000000/resize-horizontal.png",
    bed: "https://img.icons8.com/ios-filled/50/000000/bed.png",
    bath: "https://img.icons8.com/ios-filled/50/000000/bath.png",
    parking: "https://img.icons8.com/ios-filled/50/000000/parking.png",
    sofa: "https://img.icons8.com/ios-filled/50/000000/sofa.png",
    document: "https://img.icons8.com/ios-filled/50/000000/document.png",
    note: "https://img.icons8.com/ios-filled/50/000000/note.png",
    checkmark: "https://img.icons8.com/ios-filled/50/000000/checkmark.png",
    blueprint: "https://img.icons8.com/ios-filled/50/000000/blueprint.png",
    phone: "https://img.icons8.com/ios-filled/50/000000/phone.png",
};

// Add styles for the grid layout in Main Information
const mainInfoStyles = StyleSheet.create({
    grid: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    gridItem: {
        width: '48%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        border: '1px solid #ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    text: {
        fontSize: 12,
        fontFamily: 'Roboto',
    },
});

// AgentInformation Component
const AgentInformation: React.FC<{ agent: DB_Profile }> = ({ agent }) => (
    <View style={agentStyles.container}>
        <Text style={agentStyles.header}>Agent Information</Text>
        <View style={agentStyles.row}>
            {agent.avatar_url && (
                <Image src={agent.avatar_url} style={agentStyles.avatar} />
            )}
            <Text style={agentStyles.text}>{agent.full_name}</Text>
        </View>
        <View style={agentStyles.row}>
            <Image src={ICONS.note} style={{ width: 16, height: 16, marginRight: 5 }} />
            <Text style={agentStyles.text}>Email: {agent.email}</Text>
        </View>
        {agent.whatsapp && (
            <View style={agentStyles.row}>
                <Image src={ICONS.phone} style={{ width: 16, height: 16, marginRight: 5 }} />
                <Text style={agentStyles.text}>WhatsApp: {agent.whatsapp}</Text>
            </View>
        )}
        {agent.location && (
            <View style={agentStyles.row}>
                <Image src={ICONS.marker} style={{ width: 16, height: 16, marginRight: 5 }} />
                <Text style={agentStyles.text}>Location: {agent.location}</Text>
            </View>
        )}
    </View>
);

type UnitTypePDFDocumentProps = {
    unitType: DB_Unit_Types;
    agent: DB_Profile | null; // Optional agent prop
};

const UnitTypePDFDocument: React.FC<UnitTypePDFDocumentProps> = (props) => {
    const {unitType, agent} = props;
    console.log('unitType:', unitType);
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {agent && <AgentInformation agent={agent}/>}

                {/* Title Section */}
                <View style={styles.section}>
                    <Text style={styles.title}>{unitType.title}</Text>
                    <Text style={styles.address}>
                        <Image src={ICONS.marker} style={{ width: 12, height: 12 }} /> Address: {unitType.location}
                    </Text>
                    <Text style={styles.text}>{unitType.description}</Text>
                </View>

                {/* Main Information */}
                <View style={styles.section}>
                    <Text style={styles.subtitle}>Main Information:</Text>
                    <View style={mainInfoStyles.grid}>
                        <View style={mainInfoStyles.gridItem}>
                            <Image src={ICONS.money} style={mainInfoStyles.icon} />
                            <Text style={mainInfoStyles.text}>Price: {unitType.price} AED</Text>
                        </View>
                        {unitType.floor_range && (
                            <View style={mainInfoStyles.gridItem}>
                                <Image src={ICONS.building} style={mainInfoStyles.icon} />
                                <Text style={mainInfoStyles.text}>Floor: {unitType.floor_range} sqft</Text>
                            </View>
                        )}
                        {unitType.sqft && (
                            <View style={mainInfoStyles.gridItem}>
                                <Image src={ICONS.resize} style={mainInfoStyles.icon} />
                                <Text style={mainInfoStyles.text}>Size: {unitType.sqft} sqft</Text>
                            </View>
                        )}
                        {unitType.bedrooms && (
                            <View style={mainInfoStyles.gridItem}>
                                <Image src={ICONS.bed} style={mainInfoStyles.icon} />
                                <Text style={mainInfoStyles.text}>Bedrooms: {unitType.bedrooms}</Text>
                            </View>
                        )}
                        {unitType.bathrooms && (
                            <View style={mainInfoStyles.gridItem}>
                                <Image src={ICONS.bath} style={mainInfoStyles.icon} />
                                <Text style={mainInfoStyles.text}>Bathrooms: {unitType.bathrooms}</Text>
                            </View>
                        )}
                        {unitType.parking_available !== null && (
                            <View style={mainInfoStyles.gridItem}>
                                <Image src={ICONS.parking} style={mainInfoStyles.icon} />
                                <Text style={mainInfoStyles.text}>
                                    Parking Available: {unitType.parking_available ? 'Yes' : 'No'}
                                </Text>
                            </View>
                        )}
                        {unitType.furnishing_status && (
                            <View style={mainInfoStyles.gridItem}>
                                <Image src={ICONS.sofa} style={mainInfoStyles.icon} />
                                <Text style={mainInfoStyles.text}>Furnishing Status: {unitType.furnishing_status}</Text>
                            </View>
                        )}
                        {unitType.status && (
                            <View style={mainInfoStyles.gridItem}>
                                <Image src={ICONS.document} style={mainInfoStyles.icon} />
                                <Text style={mainInfoStyles.text}>Status: {unitType.status}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Amenities Section */}
                <View style={styles.section}>
                    <Text style={styles.subtitle}>Amenities:</Text>
                    <View style={styles.grid}>
                        {unitType.amenities?.map((amenity, index) => (
                            <Text key={index} style={styles.gridItem}>
                                <Image src={ICONS.checkmark} style={{ width: 12, height: 12 }} /> {amenity}
                            </Text>
                        ))}
                    </View>
                </View>
            </Page>

            {/* Images Section */}
            {unitType.images && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.section}>
                        <Text style={styles.subtitle}>Pictures</Text>
                        <View style={styles.imageGrid}>
                            {unitType.images.map((image, index) => (
                                <Image key={index} src={image} style={styles.image}/>
                            ))}
                        </View>
                    </View>
                </Page>
            )}

            {/* Floor Plan Section */}
            {unitType.floor_plan_image && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.section}>
                        <Text style={styles.subtitle}>
                            <Image src={ICONS.blueprint} style={{ width: 12, height: 12 }} /> Floor Plan
                        </Text>
                        <Image
                            src={unitType.floor_plan_image}
                            style={styles.floorPlanImage}
                        />
                    </View>
                </Page>
            )}
        </Document>
    );
};

export default UnitTypePDFDocument;

