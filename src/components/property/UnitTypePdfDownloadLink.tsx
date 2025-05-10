import React from 'react';
import UnitTypePDFDocument from "../pdfs/UnitTypePDFDocument.tsx";
import {Download} from "lucide-react";
import {PDFDownloadLink} from "@react-pdf/renderer";

type UnitTypePdfDowloadLinkProps = {
    profile: DB_Profile | null;
    unitType: DB_Unit_Types;
}

const UnitTypePdfDowloadLink = (props: UnitTypePdfDowloadLinkProps) => {
    const {profile, unitType} = props;
    return (
        <PDFDownloadLink
            document={<UnitTypePDFDocument
                agent={profile?.role === 'agent' ? profile : null}
                unitType={unitType} />}
            fileName={`${unitType.id}.pdf`}
            className="flex items-center justify-center gap-2 py-2 px-4 mb-2 bg-gray-800 text-white rounded-lg hover:bg-black transition-colors"><Download className="h-4 w-4" /><span className="text-sm text-center">Download PDF Brochure</span>
        </PDFDownloadLink>
    );
};

export default UnitTypePdfDowloadLink;
